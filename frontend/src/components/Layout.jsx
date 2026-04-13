import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import useAuthStore from '../store/authStore';
import ConfirmDialog from './ConfirmDialog';
import AppSidebar from './AppSidebar';
import { fade } from '../lib/motion';
import { getAllEventsApi } from '../api/eventApi';
import {
  getRecentNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '../api/notificationApi';
import { publicAssetUrl } from '../lib/publicAssetUrl';
import { useToast } from '../context/ToastContext';

const userInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function formatTimeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

const MARQUEE_STATUSES = new Set(['open', 'assigning', 'judging']);

function routeTitle(pathname) {
  if (pathname === '/coordinator/dashboard') return 'Dashboard';
  if (pathname === '/coordinator/analytics') return 'Analytics';
  if (pathname === '/coordinator/evaluation-progress') return 'Evaluation progress';
  if (pathname === '/coordinator/events/create') return 'Create Event';
  if (pathname.includes('/coordinator/events/') && pathname.includes('/registrations')) return 'Registrations';
  if (pathname.includes('/coordinator/events/') && pathname.includes('/assign')) return 'Assign Teams';
  if (pathname.includes('/coordinator/events/') && pathname.includes('/results')) return 'Results';
  if (pathname === '/participant/dashboard') return 'Browse Events';
  if (pathname === '/participant/my-registrations') return 'My Registrations';
  if (pathname === '/participant/my-scores') return 'My Scores';
  if (pathname.includes('/participant/events/') && pathname.includes('/register')) return 'Register Team';
  if (pathname === '/judge/dashboard') return 'Judge Dashboard';
  if (pathname === '/judge/events') return 'Browse Events';
  if (pathname === '/judge/pending-evaluations') return 'Pending Evaluations';
  if (pathname.includes('/judge/events/') && pathname.includes('/onboard')) return 'Onboarding';
  if (pathname.includes('/judge/events/') && pathname.includes('/evaluate')) return 'Evaluate';
  if (pathname.includes('/judge/events/') && pathname.includes('/assignments')) return 'Assignments';
  if (pathname === '/profile') return 'Profile';
  if (pathname.startsWith('/events/')) return 'Event';
  return 'Eventify';
}

const Layout = ({ children, maxWidth = 'wide', viewport = 'default', pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuthStore();
  const logout = useAuthStore((s) => s.logout);
  const { push: toast } = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [marqueeEvents, setMarqueeEvents] = useState([]);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifyRef = useRef(null);

  const title = pageTitle ?? routeTitle(location.pathname);

  const handleLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate('/login');
  };

  const widthClass = maxWidth === 'narrow' ? 'narrow' : maxWidth === 'medium' ? 'medium' : 'wide';
  const showSidebar = token && user;

  const shellClass = `ds-shell${viewport === 'command' ? ' ds-shell--command' : ''}`;
  const mainClass = `ds-main ${widthClass}${viewport === 'command' ? ' ds-main--flush' : ''}`;

  const fetchMarquee = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getAllEventsApi();
      const list = res.data?.data || [];
      const filtered = list.filter((e) => MARQUEE_STATUSES.has(e.status));
      setMarqueeEvents(filtered);
    } catch {
      setMarqueeEvents([]);
    }
  }, [token]);

  const fetchNotifications = useCallback(
    async (silent) => {
      if (!token) return;
      try {
        const res = await getRecentNotificationsApi();
        const payload = res.data?.data;
        setNotifications(payload?.items || []);
        setUnreadCount(Number(payload?.unreadCount) || 0);
      } catch (e) {
        if (!silent) toast(e.response?.data?.message || 'Could not load notifications', 'error');
      }
    },
    [token, toast]
  );

  useEffect(() => {
    fetchMarquee();
  }, [fetchMarquee, location.pathname]);

  useEffect(() => {
    if (!token) return undefined;
    fetchNotifications(false);
    const id = setInterval(() => fetchNotifications(true), 60_000);
    return () => clearInterval(id);
  }, [token, fetchNotifications]);

  useEffect(() => {
    if (!notifyOpen) return undefined;
    const onDoc = (e) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setNotifyOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifyOpen]);

  const onOpenEvent = (eventId) => {
    navigate(`/events/${eventId}`);
    setNotifyOpen(false);
  };

  const onMarkOne = async (n) => {
    if (!n.read && n._id) {
      try {
        await markNotificationReadApi(n._id);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        toast(e.response?.data?.message || 'Could not mark as read', 'error');
      }
    }
    if (n.eventId) onOpenEvent(n.eventId);
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch (e) {
      toast(e.response?.data?.message || 'Could not mark all read', 'error');
    }
  };

  const avatarSrc = user?.avatarUrl ? publicAssetUrl(user.avatarUrl) : '';

  return (
    <div className={shellClass}>
      <div className="ds-layout">
        {showSidebar ? <AppSidebar /> : null}

        <div className="ds-main-wrap">
          {token && user ? (
            <motion.header
              className="ds-topbar"
              variants={fade}
              initial={false}
              animate="animate"
            >
              <h1 className="ds-topbar__title">{title}</h1>
              <div className="ds-topbar__right">
                <div className="ds-marquee" aria-label="Upcoming events">
                  <div className="ds-marquee__inner">
                    {marqueeEvents.length === 0 ? (
                      <span className="ds-marquee__empty">No active events</span>
                    ) : (
                      <div className="ds-marquee__track">
                        {[...marqueeEvents, ...marqueeEvents].map((ev, idx) => (
                          <span key={`${ev._id}-${idx}`} className="ds-marquee__row">
                            {idx > 0 ? <span className="ds-marquee__sep">·</span> : null}
                            <button
                              type="button"
                              className="ds-marquee__link"
                              onClick={() => navigate(`/events/${ev._id}`)}
                            >
                              {ev.title}
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ds-notify" ref={notifyRef}>
                  <button
                    type="button"
                    className="ds-notify__trigger"
                    aria-expanded={notifyOpen}
                    aria-label="Notifications"
                    onClick={() => setNotifyOpen((o) => !o)}
                  >
                    <Bell size={18} strokeWidth={1.75} />
                    <span
                      className={`ds-bell-badge ${unreadCount > 0 ? 'ds-bell-badge--on' : ''}`.trim()}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </button>
                  {notifyOpen ? (
                    <div className="ds-notify__panel" role="dialog" aria-label="Notifications list">
                      <div className="ds-notify__panel-head">
                        <span className="ds-notify__panel-title">Notifications</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onMarkAll}>
                          Mark all read
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="ds-notify__item">
                          <p className="form-hint mb-0">No notifications yet.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n._id} className="ds-notify__item">
                            <div className="ds-notify__item-meta">
                              {n.eventTitle ? <strong>{n.eventTitle}</strong> : null}{' '}
                              <span>{formatTimeAgo(n.createdAt)}</span>
                              {!n.read ? <span className="badge badge-open ds-notify__new-badge">New</span> : null}
                            </div>
                            <p className="ds-notify__item-msg">{n.message}</p>
                            <div className="ds-notify__item-row">
                              <button
                                type="button"
                                className="ds-notify__link"
                                onClick={() => onMarkOne(n)}
                              >
                                View event
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="ds-topbar-avatar" aria-hidden>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="ds-topbar-avatar__img" />
                  ) : (
                    userInitials(user.name)
                  )}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLogoutOpen(true)}>
                  Logout
                </button>
              </div>
            </motion.header>
          ) : null}

          <main className={mainClass}>{children}</main>
        </div>
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
