import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEventsApi } from '../../api/eventApi';
import { getMyProfilesApi } from '../../api/judgeApi';
import useAuthStore from '../../store/authStore';

const JudgeEventListPage = () => {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);
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

  if (loading) return <p style={{ padding: 40 }}>Loading events...</p>;
  if (error)   return <p style={{ padding: 40, color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>Events to Judge</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/judge/dashboard')} style={secondaryBtn}>My Dashboard</button>
          <button onClick={() => { logout(); navigate('/login'); }} style={secondaryBtn}>Logout</button>
        </div>
      </div>

      {events.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>
          No events available to judge right now.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event) => {
          const alreadySignedUp = signedUpIds.has(event._id);
          return (
            <div key={event._id} style={{
              border: '1px solid #e0e0e0', borderRadius: 10, padding: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px' }}>{event.title}</h3>
                  <p style={{ margin: '0 0 10px', color: '#666', fontSize: 14 }}>
                    {event.description}
                  </p>

                  {/* Domains */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {event.domains.map((d) => (
                      <span key={d} style={{
                        padding: '3px 10px', background: '#EEF2FF',
                        color: '#4F46E5', borderRadius: 20, fontSize: 12,
                      }}>{d}</span>
                    ))}
                  </div>

                  {/* Slot capacities */}
                  <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
                    {event.slots?.map((s) => (
                      <span key={s.slotNumber} style={{ marginRight: 14 }}>
                        Slot {s.slotNumber}: {new Date(s.date).toLocaleDateString()} · {s.startTime}
                        &nbsp;
                        <span style={{ color: s.judgeCount >= 25 ? '#A32D2D' : '#3B6D11', fontWeight: 600 }}>
                          ({s.judgeCount}/25)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                  {alreadySignedUp ? (
                    <span style={{
                      fontSize: 13, color: '#3B6D11', background: '#EAF3DE',
                      padding: '6px 14px', borderRadius: 20, fontWeight: 600,
                    }}>
                      ✓ Signed Up
                    </span>
                  ) : event.status === 'open' ? (
                    <button
                      onClick={() => navigate(`/judge/events/${event._id}/onboard`)}
                      style={primaryBtn}>
                      Sign Up to Judge
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: '#999' }}>
                      Registration closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const primaryBtn   = { padding: '9px 18px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' };
const secondaryBtn = { padding: '9px 16px', background: 'transparent', color: '#4F46E5', border: '1px solid #4F46E5', borderRadius: 6, fontSize: 14, cursor: 'pointer' };

export default JudgeEventListPage;