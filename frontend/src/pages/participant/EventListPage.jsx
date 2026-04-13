import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllEventsApi } from '../../api/eventApi';
import { getMyRegistrationsApi } from '../../api/registrationApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';
import PageShell from '../../components/ui/PageShell';
import HeroBanner from '../../components/ui/HeroBanner';
import EventCard from '../../components/ui/EventCard';
import { staggerContainer, staggerItem } from '../../lib/motion';

const attendeeTotal = (event) => {
  const slots = event.slots || [];
  let n = 0;
  for (const s of slots) {
    n += Number(s.judgeCount) || 0;
  }
  return n;
};

const formatShort = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
};

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeKey, setTimeKey] = useState(0);

  useEffect(() => {
    Promise.all([getAllEventsApi(), getMyRegistrationsApi()])
      .then(([eventsRes, regsRes]) => {
        setEvents(eventsRes.data.data);
        const ids = regsRes.data.data.map((r) => r.eventId?._id || r.eventId);
        setRegisteredIds(new Set(ids));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTimeKey((k) => k + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      if (filter === 'all') return true;
      if (filter === 'open') return e.status === 'open';
      if (filter === 'upcoming') {
        if (e.status === 'draft') return true;
        if (e.status === 'open' && e.eventStartDate) {
          return new Date(e.eventStartDate).getTime() > now;
        }
        return false;
      }
      if (filter === 'closed') {
        return e.status === 'assigning' || e.status === 'judging' || e.status === 'completed';
      }
      return true;
    });
  }, [events, filter, timeKey]);

  if (loading) {
    return (
      <Layout maxWidth="wide" viewport="command">
        <div className="participant-cmd-root">
          <div className="loading-wrapper loading-wrapper--embed">
            <div className="spinner" />
            <span className="loading-text">Loading events…</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="wide" viewport="command">
      <PageShell>
        <div className="participant-cmd-root">
          <HeroBanner
            greeting={`Hi, ${user?.name?.split(' ')[0] || 'there'}`}
            subtitle="Browse open competitions, register your team, and track deadlines."
          />

          <div className="coop-cmd-top ds-mt-24">
            <div>
              <h1 className="coop-cmd-title gradient-text">Browse events</h1>
              <p className="coop-cmd-sub">Welcome back, {user?.name}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/participant/my-registrations')}
              className="btn btn-secondary btn-sm"
            >
              My Registrations
            </button>
          </div>

          <div className="participant-filter-row" role="tablist" aria-label="Filter events">
            {[
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'closed', label: 'Closed' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {filter === f.id ? (
                  <motion.span
                    className="filter-pill-bg"
                    layoutId="participantFilterPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="filter-pill-label">{f.label}</span>
              </button>
            ))}
          </div>

          {events.length === 0 && (
            <div className="glass-card no-hover empty-state empty-state-compact">
              <div className="empty-state-icon" aria-hidden>
                —
              </div>
              <h3>No events available</h3>
              <p>No events at the moment. Check back later.</p>
            </div>
          )}

          {events.length > 0 && filtered.length === 0 && (
            <div className="glass-card no-hover coop-panel">
              <p className="coop-cmd-sub">No events match this filter.</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <motion.div
              key={filter}
              className="ds-events-grid"
              variants={staggerContainer}
              initial={false}
              animate="visible"
            >
              {filtered.map((event) => {
                const alreadyRegistered = registeredIds.has(event._id);
                const start = formatShort(event.eventStartDate);
                const end = formatShort(event.eventEndDate);
                const deadline = formatShort(event.registrationDeadline);
                const metaSegments = [];
                if (start && end) metaSegments.push(`${start} – ${end}`);
                else if (start || end) metaSegments.push(start || end);
                if (deadline) metaSegments.push(`Reg. deadline ${deadline}`);
                metaSegments.push(`${attendeeTotal(event)} slot capacity`);

                let actionsEl = null;
                if (alreadyRegistered) {
                  actionsEl = (
                    <span className="badge badge-success" style={{ alignSelf: 'center' }}>
                      Registered
                    </span>
                  );
                } else if (event.status === 'open') {
                  actionsEl = null;
                } else {
                  actionsEl = (
                    <span className="coop-cmd-sub" style={{ alignSelf: 'center' }}>
                      {event.status === 'completed' ? 'Ended' : 'Unavailable'}
                    </span>
                  );
                }

                const primaryAction =
                  !alreadyRegistered && event.status === 'open'
                    ? {
                        label: 'Register',
                        onClick: () => navigate(`/participant/events/${event._id}/register`),
                      }
                    : null;

                return (
                  <motion.div key={event._id} variants={staggerItem}>
                    <EventCard
                      title={event.title}
                      status={event.status}
                      category={event.category}
                      tags={event.domains || []}
                      maxTags={3}
                      metadataLine={metaSegments.join('  ·  ')}
                      primaryAction={primaryAction}
                      actions={actionsEl}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageShell>
    </Layout>
  );
};

export default ParticipantDashboard;
