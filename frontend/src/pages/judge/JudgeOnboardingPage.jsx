import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByIdApi } from '../../api/eventApi';
import { onboardJudgeApi } from '../../api/judgeApi';

const JudgeOnboardingPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event,      setEvent]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const [domains,    setDomains]    = useState([]);
  const [slotNumber, setSlotNumber] = useState(null);

  useEffect(() => {
    getEventByIdApi(eventId)
      .then((res) => setEvent(res.data.data))
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const toggleDomain = (d) =>
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (domains.length === 0)  return setError('Select at least one domain');
    if (slotNumber === null)   return setError('Select a judging slot');

    setSubmitting(true);
    try {
      await onboardJudgeApi(eventId, { domains, slotNumber });
      navigate('/judge/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-up failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading event...</p>;
  if (!event)  return <p style={{ padding: 40, color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 580, margin: '40px auto', padding: '0 1rem' }}>
      <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
      <h2 style={{ marginTop: 12 }}>Sign Up to Judge</h2>
      <p style={{ color: '#666', marginBottom: 28 }}>{event.title}</p>

      {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Domain expertise */}
        <div>
          <label style={labelStyle}>
            Your Expertise Domain(s) *
            <span style={{ color: '#999', fontWeight: 400, fontSize: 13 }}> — select all that apply</span>
          </label>
          <p style={{ fontSize: 13, color: '#666', margin: '4px 0 10px' }}>
            You will only be assigned teams whose project domains match yours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {event.domains.map((d) => (
              <label key={d} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${domains.includes(d) ? '#4F46E5' : '#ddd'}`,
                background: domains.includes(d) ? '#EEF2FF' : '#fff',
                color: domains.includes(d) ? '#4F46E5' : '#555',
                fontSize: 14, userSelect: 'none',
                transition: 'all 0.15s',
              }}>
                <input type="checkbox" checked={domains.includes(d)}
                  onChange={() => toggleDomain(d)} style={{ display: 'none' }} />
                {domains.includes(d) ? '✓ ' : ''}{d}
              </label>
            ))}
          </div>
        </div>

        {/* Slot selection */}
        <div>
          <label style={labelStyle}>
            Choose Your Judging Slot *
            <span style={{ color: '#999', fontWeight: 400, fontSize: 13 }}> — 3 hours, offline</span>
          </label>
          <p style={{ fontSize: 13, color: '#666', margin: '4px 0 10px' }}>
            Each slot has a maximum of 25 judges.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {event.slots.map((slot) => {
              const isFull     = slot.judgeCount >= 25;
              const isSelected = slotNumber === slot.slotNumber;
              return (
                <label key={slot.slotNumber} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: 8, cursor: isFull ? 'not-allowed' : 'pointer',
                  border: `1px solid ${isSelected ? '#4F46E5' : '#ddd'}`,
                  background: isFull ? '#fafafa' : isSelected ? '#EEF2FF' : '#fff',
                  opacity: isFull ? 0.6 : 1,
                  userSelect: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="radio"
                      name="slot"
                      disabled={isFull}
                      checked={isSelected}
                      onChange={() => setSlotNumber(slot.slotNumber)}
                    />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: isFull ? '#999' : '#333' }}>
                        Slot {slot.slotNumber}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>
                        {new Date(slot.date).toLocaleDateString('en-IN', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })} &nbsp;·&nbsp; {slot.startTime} (3 hrs)
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                    background: isFull ? '#fee' : '#EAF3DE',
                    color: isFull ? '#A32D2D' : '#3B6D11',
                  }}>
                    {isFull ? 'Full' : `${slot.judgeCount}/25`}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={submitting} style={primaryBtn}>
          {submitting ? 'Submitting...' : 'Confirm Sign-Up'}
        </button>
      </form>
    </div>
  );
};

const labelStyle = { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 2 };
const primaryBtn = { padding: '12px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer' };
const backBtn    = { background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 14, padding: 0 };

export default JudgeOnboardingPage;