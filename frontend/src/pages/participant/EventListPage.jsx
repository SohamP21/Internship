import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEventsApi } from '../../api/eventApi';
import { getMyRegistrationsApi } from '../../api/registrationApi';
import useAuthStore from '../../store/authStore';

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);
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

  if (loading) return <p style={{ padding: 40 }}>Loading events...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>Available Events</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/participant/my-registrations')} style={secondaryBtn}>
            My Registrations
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={secondaryBtn}>
            Logout
          </button>
        </div>
      </div>

      {events.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>No open events at the moment.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event) => {
          const alreadyRegistered = registeredIds.has(event._id);
          return (
            <div key={event._id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px' }}>{event.title}</h3>
                  <p style={{ margin: '0 0 10px', color: '#666', fontSize: 14 }}>{event.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {event.domains.map((d) => (
                      <span key={d} style={{
                        padding: '3px 10px', background: '#EEF2FF',
                        color: '#4F46E5', borderRadius: 20, fontSize: 12,
                      }}>{d}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                  {alreadyRegistered ? (
                    <span style={{
                      fontSize: 13, color: '#3B6D11', background: '#EAF3DE',
                      padding: '6px 14px', borderRadius: 20, fontWeight: 600,
                    }}>
                      ✓ Registered
                    </span>
                  ) : event.status === 'open' ? (
                    <button
                      onClick={() => navigate(`/participant/events/${event._id}/register`)}
                      style={primaryBtn}>
                      Register Team
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: '#999' }}>
                      {event.status === 'completed' ? 'Event ended' : 'Registration closed'}
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

export default ParticipantDashboard;