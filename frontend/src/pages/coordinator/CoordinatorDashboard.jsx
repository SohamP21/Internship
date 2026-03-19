import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEventsApi, transitionStatusApi, deleteEventApi } from '../../api/eventApi';
import useAuthStore from '../../store/authStore';

const STATUS_COLORS = {
  draft:      { bg: '#f1f1f1', color: '#555' },
  open:       { bg: '#EAF3DE', color: '#3B6D11' },
  assigning:  { bg: '#FAEEDA', color: '#854F0B' },
  judging:    { bg: '#EEF2FF', color: '#4F46E5' },
  completed:  { bg: '#E1F5EE', color: '#0F6E56' },
};

const NEXT_STATUS = {
  draft:     'open',
  open:      'assigning',
  assigning: 'judging',
  judging:   'completed',
};

const NEXT_LABEL = {
  draft:     'Open Registrations',
  open:      'Close & Start Assigning',
  assigning: 'Start Judging',
  judging:   'Mark Completed',
};

const CoordinatorDashboard = () => {
  const navigate  = useNavigate();
  const logout    = useAuthStore((s) => s.logout);
  const user      = useAuthStore((s) => s.user);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchEvents = async () => {
    try {
      const res = await getAllEventsApi();
      setEvents(res.data.data);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleTransition = async (id, newStatus) => {
    try {
      await transitionStatusApi(id, newStatus);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await deleteEventApi(id);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>Coordinator Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/coordinator/events/create')} style={primaryBtn}>
            + Create Event
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={secondaryBtn}>
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ fontSize: 18 }}>No events yet</p>
          <p style={{ fontSize: 14 }}>Click "Create Event" to get started</p>
        </div>
      )}

      {/* Event cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event) => {
          const sc = STATUS_COLORS[event.status] || STATUS_COLORS.draft;
          return (
            <div key={event._id} style={{
              border: '1px solid #e0e0e0', borderRadius: 10,
              padding: 20, background: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px' }}>{event.title}</h3>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    background: sc.bg, color: sc.color,
                  }}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
  {NEXT_STATUS[event.status] && (
    <button
      onClick={() => handleTransition(event._id, NEXT_STATUS[event.status])}
      style={{ ...primaryBtn, fontSize: 12, padding: '7px 14px' }}>
      {NEXT_LABEL[event.status]}
    </button>
  )}
  <button
    onClick={() => navigate(`/coordinator/events/${event._id}/registrations`)}
    style={{ ...secondaryBtn, fontSize: 12, padding: '7px 14px' }}>
    View Registrations
  </button>

    {(event.status === 'judging' || event.status === 'completed') && (
    <button
      onClick={() => navigate(`/coordinator/events/${event._id}/results`)}
      style={{ ...secondaryBtn, fontSize: 12, padding: '7px 14px' }}>
      View Results
    </button>
  )}
  {event.status === 'assigning' && (
  <button
    onClick={() => navigate(`/coordinator/events/${event._id}/assign`)}
    style={{ ...primaryBtn, fontSize: 12, padding: '7px 14px' }}>
    Assign Teams
  </button>
)}
  {event.status === 'draft' && (
    <button onClick={() => handleDelete(event._id)}
      style={{ ...secondaryBtn, fontSize: 12, padding: '7px 14px', color: 'red', borderColor: 'red' }}>
      Delete
    </button>
  )}
</div>
              </div>

              {/* Domains */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {event.domains.map((d) => (
                  <span key={d} style={{
                    padding: '3px 10px', background: '#EEF2FF',
                    color: '#4F46E5', borderRadius: 20, fontSize: 12,
                  }}>{d}</span>
                ))}
              </div>

              {/* Slots summary */}
              <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                {event.slots?.map((s) => (
                  <span key={s.slotNumber} style={{ marginRight: 16 }}>
                    Slot {s.slotNumber}: {new Date(s.date).toLocaleDateString()} at {s.startTime}
                    &nbsp;({s.judgeCount}/25 judges)
                  </span>
                ))}
              </div>

              {/* Rubric summary */}
              <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                Rubric: {event.rubric?.criteria?.map((c) => `${c.name} (${c.maxScore}pts)`).join(' · ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const primaryBtn = {
  padding: '10px 20px', background: '#4F46E5', color: '#fff',
  border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer',
};
const secondaryBtn = {
  padding: '9px 16px', background: 'transparent', color: '#4F46E5',
  border: '1px solid #4F46E5', borderRadius: 6, fontSize: 14, cursor: 'pointer',
};

export default CoordinatorDashboard;