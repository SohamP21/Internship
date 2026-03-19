import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfilesApi } from '../../api/judgeApi';
import useAuthStore from '../../store/authStore';

const STATUS_COLORS = {
  draft:     { bg: '#f1f1f1', color: '#555' },
  open:      { bg: '#EAF3DE', color: '#3B6D11' },
  assigning: { bg: '#FAEEDA', color: '#854F0B' },
  judging:   { bg: '#EEF2FF', color: '#4F46E5' },
  completed: { bg: '#E1F5EE', color: '#0F6E56' },
};

const JudgeDashboard = () => {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);
  const [profiles, setProfiles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getMyProfilesApi()
      .then((res) => setProfiles(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>Judge Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/judge/events')} style={secondaryBtn}>Browse Events</button>
          <button onClick={() => { logout(); navigate('/login'); }} style={secondaryBtn}>Logout</button>
        </div>
      </div>

      {profiles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ fontSize: 18 }}>You haven't signed up to judge any events yet</p>
          <button onClick={() => navigate('/judge/events')} style={{ ...primaryBtn, marginTop: 12 }}>
            Browse Events
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {profiles.map((profile) => {
          const event = profile.eventId;
          const sc    = STATUS_COLORS[event?.status] || STATUS_COLORS.draft;
          const slot  = event?.slots?.find((s) => s.slotNumber === profile.slotNumber);

          return (
            <div key={profile._id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px' }}>{event?.title}</h3>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color,
                  }}>
                    {event?.status?.toUpperCase()}
                  </span>
                </div>
                {/* Evaluate button — only shown when event is in judging phase */}
                {event?.status === 'judging' && (
                  <button
                    onClick={() => navigate(`/judge/events/${event._id}/assignments`)}
                    style={primaryBtn}>
                    Evaluate Teams
                  </button>
                )}
              </div>

              {/* Judge's selected domains */}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, color: '#555', fontWeight: 600, margin: '0 0 6px' }}>Your domains</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.domains.map((d) => (
                    <span key={d} style={{ padding: '3px 10px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 20, fontSize: 12 }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Slot info */}
              {slot && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#f9f9f9', borderRadius: 6 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
                    <strong>Your slot:</strong> Slot {slot.slotNumber} &nbsp;·&nbsp;
                    {new Date(slot.date).toLocaleDateString('en-IN', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })} &nbsp;·&nbsp; {slot.startTime} (3 hrs)
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const primaryBtn   = { padding: '9px 18px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' };
const secondaryBtn = { padding: '9px 16px', background: 'transparent', color: '#4F46E5', border: '1px solid #4F46E5', borderRadius: 6, fontSize: 14, cursor: 'pointer' };

export default JudgeDashboard;