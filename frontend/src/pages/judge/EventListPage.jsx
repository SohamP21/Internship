import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEventsApi } from '../../api/eventApi';
import { getMyProfilesApi } from '../../api/judgeApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';

const JudgeEventListPage = () => {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const [events,      setEvents]      = useState([]);
  const [signedUpIds, setSignedUpIds] = useState(new Set());
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    Promise.all([getAllEventsApi(), getMyProfilesApi()])
      .then(([eventsRes, profilesRes]) => {
        setEvents(eventsRes.data.data);
        const ids = profilesRes.data.data.map(
          (p) => p.eventId?._id || p.eventId
        );
        setSignedUpIds(new Set(ids));
      })
      .catch(() => setError('Failed to load events'))
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

  if (error) {
    return (
      <Layout maxWidth="medium">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      <div className="page-header">
        <div className="page-header-info">
          <h2 className="gradient-text">Events to Judge</h2>
          <p>Welcome, {user?.name} — browse and sign up for events</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => navigate('/judge/dashboard')} className="btn btn-secondary">
            My Dashboard
          </button>
        </div>
      </div>

      {events.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎪</div>
          <h3>No events available</h3>
          <p>No events available to judge right now.</p>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event) => {
          const alreadySignedUp = signedUpIds.has(event._id);
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

                  {/* Domains */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {event.domains.map((d) => (
                      <span key={d} className="domain-tag">{d}</span>
                    ))}
                  </div>

                  {/* Slot capacities */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {event.slots?.map((s) => (
                      <span key={s.slotNumber}>
                        <strong>Slot {s.slotNumber}:</strong>{' '}
                        {new Date(s.date).toLocaleDateString()} · {s.startTime}–{s.endTime}{' '}
                        <span style={{
                          color: s.judgeCount >= 25 ? 'var(--danger)' : 'var(--success)',
                          fontWeight: 600,
                        }}>
                          ({s.judgeCount}/25)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                  {alreadySignedUp ? (
                    <span className="badge badge-success" style={{ padding: '6px 14px' }}>
                      ✓ Signed Up
                    </span>
                  ) : event.status === 'open' ? (
                    <button
                      onClick={() => navigate(`/judge/events/${event._id}/onboard`)}
                      className="btn btn-primary btn-sm"
                    >
                      Sign Up to Judge
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Registration closed
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

export default JudgeEventListPage;