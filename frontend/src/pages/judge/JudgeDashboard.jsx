import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfilesApi } from '../../api/judgeApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';

const BADGE_CLASS = {
  draft:     'badge-draft',
  open:      'badge-open',
  assigning: 'badge-assigning',
  judging:   'badge-judging',
  completed: 'badge-completed',
};

const JudgeDashboard = () => {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getMyProfilesApi()
      .then((res) => setProfiles(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading your dashboard…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      <div className="page-header">
        <div className="page-header-info">
          <h2 className="gradient-text">Judge Dashboard</h2>
          <p>Welcome back, {user?.name} ⚖️</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => navigate('/judge/events')} className="btn btn-secondary">
            Browse Events
          </button>
        </div>
      </div>

      {profiles.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">⚖️</div>
          <h3>No events signed up for</h3>
          <p>Browse events and sign up to judge</p>
          <button onClick={() => navigate('/judge/events')} className="btn btn-primary" style={{ marginTop: 4 }}>
            Browse Events
          </button>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {profiles.map((profile) => {
          const event = profile.eventId;
          const badgeClass = BADGE_CLASS[event?.status] || 'badge-draft';
          const slot  = event?.slots?.find((s) => s.slotNumber === profile.slotNumber);

          return (
            <div key={profile._id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 8px' }}>{event?.title}</h3>
                  <span className={`badge ${badgeClass}`}>
                    {event?.status?.toUpperCase()}
                  </span>
                </div>
                {event?.status === 'judging' && (
                  <button
                    onClick={() => navigate(`/judge/events/${event._id}/assignments`)}
                    className="btn btn-primary btn-sm"
                  >
                    ⚖ Evaluate Teams
                  </button>
                )}
              </div>

              {/* Domains */}
              <div style={{ marginTop: 14 }}>
                <div className="section-label">Your Domains</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {profile.domains.map((d) => (
                    <span key={d} className="domain-tag">{d}</span>
                  ))}
                </div>
              </div>

              {/* Slot info */}
              {slot && (
                <div style={{
                  marginTop: 14, padding: '12px 16px',
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Your slot:</strong> Slot {slot.slotNumber} &nbsp;·&nbsp;
                    {new Date(slot.date).toLocaleDateString('en-IN', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })} &nbsp;·&nbsp; {slot.startTime} – {slot.endTime}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default JudgeDashboard;