from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, locations, land, verification, reports, dashboard, superadmin, demo, content, admin

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Digital Land Due-Diligence Platform"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(locations.router, prefix=f"{settings.API_V1_PREFIX}/locations", tags=["Locations"])
app.include_router(land.router, prefix=f"{settings.API_V1_PREFIX}/land", tags=["Land Records"])
app.include_router(verification.router, prefix=f"{settings.API_V1_PREFIX}/verification", tags=["Verification"])
app.include_router(reports.router, prefix=f"{settings.API_V1_PREFIX}/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"])
app.include_router(superadmin.router, prefix=f"{settings.API_V1_PREFIX}/superadmin", tags=["Super Admin"])
app.include_router(demo.router, prefix=f"{settings.API_V1_PREFIX}/demo", tags=["Demo Mode"])
app.include_router(content.router, prefix=f"{settings.API_V1_PREFIX}/content", tags=["Content"])
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "note": "SYNTHETIC DEMONSTRATION DATA"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
