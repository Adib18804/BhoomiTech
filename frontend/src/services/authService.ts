import api, { DEMO_TOKEN_PREFIX } from '../utils/api';

export interface RegisterData {
  email: string;
  mobile?: string;
  full_name: string;
  password: string;
  confirm_password: string;
  preferred_language: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    preferred_language: string;
  };
}

// Frontend-only demo login for hackathon judges when the FastAPI backend is not live.
// The public demo credentials are configured via VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD
// (see frontend/.env). The mock session tokens below are generated at runtime and
// authenticate against nothing — they only mark the browser session as demo mode.
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;

function buildDemoAuthResponse(email: string): AuthResponse {
  return {
    access_token: `${DEMO_TOKEN_PREFIX}${Date.now()}`,
    refresh_token: `demo-refresh-${Date.now()}`,
    token_type: 'bearer',
    user: {
      id: 0,
      email,
      full_name: 'Demo Citizen',
      role: 'citizen',
      preferred_language: localStorage.getItem('language') || 'en',
    },
  };
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    this.storeAuthData(response.data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    if (DEMO_EMAIL && DEMO_PASSWORD && data.email === DEMO_EMAIL && data.password === DEMO_PASSWORD) {
      const demoResponse = buildDemoAuthResponse(data.email);
      this.storeAuthData(demoResponse);
      return demoResponse;
    }

    const response = await api.post('/auth/login', data);
    this.storeAuthData(response.data);
    return response.data;
  }

  async adminLogin(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/admin/login', data);
    this.storeAuthData(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      this.clearAuthData();
    }
  }

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  private storeAuthData(data: AuthResponse) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Update language preference
    if (data.user.preferred_language) {
      localStorage.setItem('language', data.user.preferred_language);
    }
  }

  private clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getRole(): string | null {
    const user = this.getUser();
    return user?.role || null;
  }
}

export default new AuthService();
