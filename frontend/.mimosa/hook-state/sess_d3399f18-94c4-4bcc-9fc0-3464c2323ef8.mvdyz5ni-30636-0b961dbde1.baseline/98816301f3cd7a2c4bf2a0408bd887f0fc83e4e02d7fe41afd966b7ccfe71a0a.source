import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import authService from '../../services/authService';

interface NavItem {
  to: string;
  labelKey: string;
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close the mobile menu on Escape (keyboard accessibility).
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'bn' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  // Public visitors and signed-in users get different navigation, per role.
  const publicNav: NavItem[] = [
    { to: '/', labelKey: 'nav.home' },
    { to: '/#how-it-works', labelKey: 'nav.howItWorks' },
    { to: '/land-buying-guide', labelKey: 'nav.landBuyingGuide' },
    { to: '/legal-updates', labelKey: 'nav.legalUpdates' },
  ];

  // Signed-in citizens reach Home via the logo, so it is not repeated as a nav item.
  const citizenNav: NavItem[] = [
    { to: '/dashboard', labelKey: 'nav.dashboard' },
    { to: '/land-search', labelKey: 'nav.checkLand' },
    { to: '/my-checks', labelKey: 'nav.myChecks' },
    { to: '/reports', labelKey: 'nav.reports' },
    { to: '/land-buying-guide', labelKey: 'nav.landBuyingGuide' },
    { to: '/legal-updates', labelKey: 'nav.legalUpdates' },
  ];

  const adminNav: NavItem[] = [
    { to: '/admin/dashboard', labelKey: 'nav.adminDashboard' },
    { to: '/manage/legal-updates', labelKey: 'nav.manageLegalUpdates' },
    { to: '/land-buying-guide', labelKey: 'nav.landBuyingGuide' },
    { to: '/legal-updates', labelKey: 'nav.legalUpdates' },
  ];

  const superAdminNav: NavItem[] = [
    { to: '/superadmin/dashboard', labelKey: 'nav.superAdmin' },
    { to: '/manage/legal-updates', labelKey: 'nav.manageLegalUpdates' },
    { to: '/land-buying-guide', labelKey: 'nav.landBuyingGuide' },
    { to: '/legal-updates', labelKey: 'nav.legalUpdates' },
  ];

  let navItems: NavItem[] = publicNav;
  if (isAuthenticated) {
    if (user?.role === 'citizen') navItems = citizenNav;
    else if (user?.role === 'admin') navItems = adminNav;
    else if (user?.role === 'super_admin') navItems = superAdminNav;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Top utility bar */}
      <div className="bg-primary-700 text-white py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center text-sm">
          <button
            onClick={toggleLanguage}
            className="hover:underline font-medium"
          >
            {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center gap-3 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 min-w-0">
            <img
              src="/logo.svg"
              alt="BhoomiTech Logo"
              className="h-10 w-auto flex-shrink-0"
              onError={(e) => {
                // Fallback to PNG if SVG doesn't exist
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-lg sm:text-xl font-bold text-primary-700 truncate">
                {t('common.appName')}
              </span>
              <span className="text-xs text-gray-600 truncate">
                {t('common.tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.to + item.labelKey}
                to={item.to}
                className="text-sm text-gray-700 hover:text-primary-600 font-medium whitespace-nowrap transition-colors"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden xl:flex items-center space-x-4 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium max-w-[9rem] truncate">{user?.full_name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium whitespace-nowrap transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary whitespace-nowrap"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile / tablet menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 -mr-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="xl:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-6rem)] overflow-y-auto">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to + item.labelKey}
                to={item.to}
                className="block py-2.5 text-gray-700 hover:text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="border-t border-gray-200 pt-3 mt-2">
                <p className="text-sm text-gray-600 mb-2 break-words">{user?.full_name}</p>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 py-2 text-red-600 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-3 mt-2 space-y-3">
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="block btn-primary text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
