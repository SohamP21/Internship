import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByIdApi } from '../../api/eventApi';
import { onboardJudgeApi } from '../../api/judgeApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

const JudgeOnboardingPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event,      setEvent]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (domains.length === 0)  return setError('Select at least one domain');
    if (slotNumber === null)   return setError('Select a judging slot');
    setConfirmOpen(true);
  };

  const confirmOnboard = async () => {
    setConfirmOpen(false);
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

  if (loading) {
    return (
      <Layout maxWidth="narrow">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading event…</span>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout maxWidth="narrow">
        <div className="alert alert-danger">{error || 'Event not found'}</div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="narrow">
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
      <h2 className="gradient-text" style={{ marginBottom: 4 }}>Sign Up to Judge</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 28 }}>{event.title}</p>

      {error && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Domain expertise */}
        <div>
          <label className="form-label" style={{ marginBottom: 4 }}>
            Your Expertise Domain(s) *
            <span style={{ fontWeight: 400, fontSize: '0.8rem' }}> — select all that apply</span>
          </label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
            You will only be assigned teams whose project domains match yours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {event.domains.map((d) => (
              <label key={d}
                className={`chip-toggle ${domains.includes(d) ? 'active' : ''}`}
                onClick={() => toggleDomain(d)}
              >
                <input type="checkbox" checked={domains.includes(d)}
                  onChange={() => toggleDomain(d)} />
                {domains.includes(d) ? '✓ ' : ''}{d}
              </label>
            ))}
          </div>
        </div>

        {/* Slot selection */}
        <div>
          <label className="form-label" style={{ marginBottom: 4 }}>
            Choose Your Judging Slot *
            <span style={{ fontWeight: 400, fontSize: '0.8rem' }}> — offline</span>
          </label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
            Each slot has a maximum of 25 judges.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {event.slots.map((slot) => {
              const isFull     = slot.judgeCount >= 25;
              const isSelected = slotNumber === slot.slotNumber;
              return (
                <label key={slot.slotNumber}
                  className={`radio-card ${isSelected ? 'active' : ''} ${isFull ? 'disabled' : ''}`}
                  onClick={() => !isFull && setSlotNumber(slot.slotNumber)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="radio"
                      name="slot"
                      disabled={isFull}
                      checked={isSelected}
                      onChange={() => setSlotNumber(slot.slotNumber)}
                    />
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: isFull ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        Slot {slot.slotNumber}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(slot.date).toLocaleDateString('en-IN', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })} &nbsp;·&nbsp; {slot.startTime} – {slot.endTime}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${isFull ? 'badge-danger' : 'badge-success'}`}>
                    {isFull ? 'Full' : `${slot.judgeCount}/25`}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
          {submitting ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Submitting…
            </>
          ) : '✦ Confirm Sign-Up'}
        </button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign up as a judge for this event?"
        message="Your domain choices and judging slot will be saved. Coordinators will assign teams that match your expertise."
        confirmLabel="Yes, sign me up"
        cancelLabel="Go back"
        variant="primary"
        onConfirm={confirmOnboard}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
};

export default JudgeOnboardingPage;