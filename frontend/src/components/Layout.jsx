import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import ConfirmDialog from './ConfirmDialog';

const roleLabels = {
  coordinator: 'Coordinator',
  participant: 'Participant',
  judge: 'Judge',
};

const dashboardPaths = {
  coordinator: '/coordinator/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

const sidebarLinksByRole = {
  coordinator: [
    { to: '/coordinator/dashboard', label: 'Dashboard' },
    { to: '/coordinator/events/create', label: 'Create Event' },
    { to: '/profile', label: 'Profile' },
  ],
  participant: [
    { to: '/participant/dashboard', label: 'Browse Events' },
    { to: '/participant/my-registrations', label: 'My Registrations' },
    { to: '/profile', label: 'Profile' },
  ],
  judge: [
    { to: '/judge/dashboard', label: 'Dashboard' },
    { to: '/judge/events', label: 'Browse Events' },
    { to: '/profile', label: 'Profile' },
  ],
};

const Layout = ({ children, maxWidth = 'wide' }) => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme } = useThemeStore();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate('/login');
  };

  const goHome = () => {
    if (user?.role && dashboardPaths[user.role]) {
      navigate(dashboardPaths[user.role]);
    }
  };

  const widthClass =
    maxWidth === 'narrow' ? 'narrow' :
    maxWidth === 'medium' ? 'medium' : 'wide';
  const sidebarLinks = user?.role ? (sidebarLinksByRole[user.role] || []) : [];
  const mainSidebarLinks = sidebarLinks.filter((link) => link.to !== '/profile');
  const profileLink = sidebarLinks.find((link) => link.to === '/profile');

  return (
    <div className="layout-shell">
      <header className="layout-header">
        <div className="layout-header-inner">
          <span className="layout-logo" onClick={goHome} role="button" tabIndex={0}>
            ✦ Eventify
          </span>
          <nav className="layout-nav">
            {token && user && (
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginRight: 8,
                display: 'none',
              }}
              className="hide-mobile"
              >
                {user.name} · {roleLabels[user.role] || user.role}
              </span>
            )}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {token && user && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLogoutOpen(true)}>
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <div className="layout-body">
        {token && user && (
          <aside className="layout-sidebar glass-card no-hover">
            <div className="layout-sidebar-user">
              <strong>{user.name}</strong>
              <span>{roleLabels[user.role] || user.role}</span>
            </div>
            <nav className="layout-sidebar-nav">
              {mainSidebarLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `layout-sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            {profileLink && (
              <NavLink
                to={profileLink.to}
                className={({ isActive }) =>
                  `layout-sidebar-link layout-sidebar-profile ${isActive ? 'active' : ''}`
                }
              >
                {profileLink.label}
              </NavLink>
            )}
          </aside>
        )}
        <main className={`layout-main ${widthClass}`}>
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        message="You will need to sign in again to access your dashboard."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
};

export default Layout;
