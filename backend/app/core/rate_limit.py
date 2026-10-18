"""In-memory sliding-window rate limiting (Phase 9).

Scope: protect the sensitive authentication and verification endpoints
(login, admin login, register, forgot password, verification check/detail)
from abuse without introducing external infrastructure (no Redis, no proxy).

Approach
--------
- A fixed 60-second sliding window per (scope, client IP) key. Timestamps of
  recent hits are kept in a deque; hits older than the window are discarded.
- Each protected endpoint has its own scope, so its budget is independent.
- Limit exceeded -> HTTP 429 with a `Retry-After` header and a clear message.
- Thread-safe (FastAPI may run sync endpoints in a threadpool).
- Fully deterministic and unit-testable: `rate_limiter.reset()` clears state.

Client identity
---------------
The connecting peer address (request.client.host) is used. X-Forwarded-For is
deliberately NOT trusted: a direct client could spoof it and bypass the limit.
If the API is ever deployed behind a trusted reverse proxy, the proxy should
resolve and forward the real client address (e.g. via uvicorn --proxy-headers
with trusted hosts).

Known limitation (documented): counters live in the API process memory, so
they are per-worker and reset on restart. This is acceptable for the current
single-worker demo deployment and deliberately avoids external dependencies;
production hardening would move the counters to a shared store.

NO AI/ML is involved anywhere: counting requests is purely deterministic.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import settings


class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding-window counter."""

    WINDOW_SECONDS = 60  # "per minute" semantics used by all settings

    def __init__(self):
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, times: int) -> tuple:
        """Record a hit for `key`; return (allowed, retry_after_seconds)."""
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            window_start = now - self.WINDOW_SECONDS
            while q and q[0] <= window_start:
                q.popleft()
            if len(q) >= times:
                retry_after = max(int(self.WINDOW_SECONDS - (now - q[0])) + 1, 1)
                return False, retry_after
            q.append(now)
            return True, 0

    def reset(self, key: str = None) -> None:
        """Clear all counters (or one key). Used by tests and verification runs."""
        with self._lock:
            if key is None:
                self._hits.clear()
            else:
                self._hits.pop(key, None)


rate_limiter = SlidingWindowRateLimiter()


def get_client_ip(request: Request) -> str:
    """Actual connection peer. X-Forwarded-For is intentionally ignored
    (spoofable unless behind a trusted proxy - see module docstring)."""
    return request.client.host if request.client else "unknown"


def rate_limit(times: int, scope: str):
    """FastAPI dependency factory enforcing `times` requests per minute per
    client IP for one logical scope (e.g. "login", "verification")."""

    def dependency(request: Request) -> None:
        allowed, retry_after = rate_limiter.check(f"{scope}:{get_client_ip(request)}", times)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please try again in {retry_after} second(s).",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency


# Concrete dependencies wired into the routers (values from Settings so they
# can be tuned via .env without code changes). One scope per endpoint keeps
# each budget independent.
rate_limit_login = rate_limit(settings.RATE_LIMIT_AUTH_PER_MINUTE, "login")
rate_limit_admin_login = rate_limit(settings.RATE_LIMIT_AUTH_PER_MINUTE, "admin_login")
rate_limit_register = rate_limit(settings.RATE_LIMIT_AUTH_PER_MINUTE, "register")
rate_limit_forgot_password = rate_limit(settings.RATE_LIMIT_AUTH_PER_MINUTE, "forgot_password")
rate_limit_verification = rate_limit(settings.RATE_LIMIT_VERIFICATION_PER_MINUTE, "verification")
