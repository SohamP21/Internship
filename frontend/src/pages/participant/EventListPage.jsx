import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEventsApi } from '../../api/eventApi';
import { getMyRegistrationsApi } from '../../api/registrationApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';

const BADGE_CLASS = {
  draft:     'badge-draft',
  open:      'badge-open',
  assigning: 'badge-assigning',
  judging:   'badge-judging',
  completed: 'badge-completed',
};

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const [events,         setEvents]         = useState([]);
  const [registeredIds,  setRegisteredIds]  = useState(new Set());
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    Promise.all([getAllEventsApi(), getMyRegistrationsApi()])
      .then(([eventsRes, regsRes]) => {
        setEvents(eventsRes.data.data);
        const ids = regsRes.data.data.map((r) => r.eventId?._id || r.eventId);
        setRegisteredIds(new Set(ids));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading events…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      <div className="page-header">
        <div className="page-header-info">
          <h2 className="gradient-text">Available Events</h2>
          <p>Welcome back, {user?.name} 👋</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => navigate('/participant/my-registrations')} className="btn btn-secondary">
            My Registrations
          </button>
        </div>
      </div>

      {events.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎪</div>
          <h3>No events available</h3>
          <p>No open events at the moment. Check back later!</p>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event) => {
          const alreadyRegistered = registeredIds.has(event._id);
          return (
            <div key={event._id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px' }}>{event.title}</h3>
                  {event.description && (
                    <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {event.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {event.domains.map((d) => (
                      <span key={d} className="domain-tag">{d}</span>
                    ))}
                  </div>
                  <span className={`badge ${BADGE_CLASS[event.status] || 'badge-draft'}`}>
                    {event.status?.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                  {alreadyRegistered ? (
                    <span className="badge badge-success" style={{ padding: '6px 14px' }}>
                      ✓ Registered
                    </span>
                  ) : event.status === 'open' ? (
                    <button
                      onClick={() => navigate(`/participant/events/${event._id}/register`)}
                      className="btn btn-primary btn-sm"
                    >
                      Register Team
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {event.status === 'completed' ? 'Event ended' : 'Registration closed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default ParticipantDashboard;