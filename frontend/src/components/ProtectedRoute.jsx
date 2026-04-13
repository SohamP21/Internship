import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Usage: <ProtectedRoute allowedRoles={['coordinator']} />
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="ds-loading-screen">
        <div className="spinner" />
        <span className="loading-text">Loading your session…</span>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they land on wrong role's page
    const dashboardMap = {
      coordinator: '/coordinator/dashboard',
      participant:  '/participant/dashboard',
      judge:        '/judge/dashboard',
    };
    return <Navigate to={dashboardMap[user.role]} replace />;
  }

  return children;
};

export default ProtectedRoute;