import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LegalUpdateTicker from './components/content/LegalUpdateTicker';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import LandSearchPage from './pages/citizen/LandSearchPage';
import SellerInformationPage from './pages/citizen/SellerInformationPage';
import VerificationResultPage from './pages/citizen/VerificationResultPage';
import LandBuyingGuidePage from './pages/citizen/LandBuyingGuidePage';
import LegalUpdatesPage from './pages/citizen/LegalUpdatesPage';
import MyChecksPage from './pages/citizen/MyChecksPage';
import ReportsPage from './pages/citizen/ReportsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LegalUpdateManagement from './pages/admin/LegalUpdateManagement';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import authService from './services/authService';

/**
 * Thin layout wrapper rendered around every authenticated page.
 * Places the LegalUpdateTicker immediately below the Header and
 * above the page content. Public pages (/, /login, etc.) do NOT
 * use this wrapper, so the ticker does not appear there.
 */
function AuthenticatedLayout() {
  return (
    <>
      <LegalUpdateTicker limit={3} />
      <Outlet />
    </>
  );
}

function ProtectedRoute({
  children,
  requiredRole
}: {
  children: React.ReactNode;
  requiredRole?: string
}) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = authService.getRole();
    if (userRole !== requiredRole && !(requiredRole === 'admin' && userRole === 'super_admin')) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* ── Public pages (no ticker) ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/land-buying-guide" element={<LandBuyingGuidePage />} />
            <Route path="/legal-updates" element={<LegalUpdatesPage />} />

            {/* ── Authenticated pages (ticker rendered by AuthenticatedLayout) ── */}
            <Route element={<AuthenticatedLayout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-checks"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <MyChecksPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/land-search"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <LandSearchPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verification/seller-info"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <SellerInformationPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verification/result"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <VerificationResultPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/verification/case/:caseId"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <VerificationResultPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/manage/legal-updates"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <LegalUpdateManagement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute requiredRole="super_admin">
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

