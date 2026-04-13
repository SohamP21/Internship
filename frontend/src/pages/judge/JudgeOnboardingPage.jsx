import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { getEventByIdApi } from '../../api/eventApi';
import { onboardJudgeApi } from '../../api/judgeApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormLayout from '../../components/forms/FormLayout';
import FormGrid from '../../components/forms/FormGrid';
import FormField from '../../components/forms/FormField';

const JudgeOnboardingPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const [domains, setDomains] = useState([]);
  const [slotNumber, setSlotNumber] = useState(null);

  useEffect(() => {
    getEventByIdApi(eventId)
      .then((res) => setEvent(res.data.data))
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const toggleDomain = (d) =>
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (domains.length === 0) return setError('Select at least one domain');
    if (slotNumber === null) return setError('Select a judging slot');
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
      <FormLayout leftTitle="Judge portal" leftSubtitle="Loading event…" leftContent={null}>
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading event…</span>
        </div>
      </FormLayout>
    );
  }

  if (!event) {
    return (
      <FormLayout leftTitle="Judge portal" leftSubtitle="Event could not be loaded." leftContent={null}>
        <div className="alert alert-danger">{error || 'Event not found'}</div>
      </FormLayout>
    );
  }

  const leftBody = (
    <div className="form-judge-hero" aria-hidden>
      <Gavel size={56} strokeWidth={1.5} className="form-judge-hero__icon" />
    </div>
  );

  return (
    <FormLayout
      leftTitle="Judge portal"
      leftSubtitle={`You are evaluating ${event.title}. Pick domains and a slot — coordinators assign teams that match your expertise.`}
      leftContent={leftBody}
      footer={
        <div className="form-shell__footer form-shell__footer--split">
          <div className="form-footer-left">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost">
              ← Back
            </button>
            <Link to="/judge/dashboard" className="btn btn-ghost">
              Dashboard
            </Link>
          </div>
          <button type="submit" form="judge-onboard-form" disabled={submitting} className="btn btn-primary">
            {submitting ? (
              <>
                <span className="spinner spinner--sm" aria-hidden />
                Submitting…
              </>
            ) : (
              'Confirm sign-up'
            )}
          </button>
        </div>
      }
    >
      {error ? <div className="alert alert-danger alert-spacing">{error}</div> : null}

      <form id="judge-onboard-form" onSubmit={handleSubmit}>
        <FormGrid>
          <FormField spanFull>
            <span className="form-field-label" id="jo-domains-hint-label">
              Your expertise domain(s) *
            </span>
            <span id="jo-domains-hint" className="form-hint">
              Select all that apply — you will only be assigned teams that match.
            </span>
            <div className="coop-tag-row domain-tags-flow domain-picker-chips" role="group" aria-labelledby="jo-domains-hint-label">
              {event.domains.map((d, i) => {
                const inputId = `jo-domain-${eventId}-${i}`;
                return (
                  <label key={`${d}-${i}`} htmlFor={inputId} className={`chip-toggle ${domains.includes(d) ? 'active' : ''}`}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={domains.includes(d)}
                      onChange={() => toggleDomain(d)}
                    />
                    <span className="chip-toggle__text">{d}</span>
                  </label>
                );
              })}
            </div>
          </FormField>

          <FormField spanFull>
            <span className="form-field-label">Choose judging slot *</span>
            <span className="form-hint">Each slot holds up to 25 judges.</span>
            <div className="slots-grid-dense">
              {event.slots.map((slot) => {
                const isFull = slot.judgeCount >= 25;
                const isSelected = slotNumber === slot.slotNumber;
                return (
                  <label
                    key={slot.slotNumber}
                    className={`radio-card ${isSelected ? 'active' : ''} ${isFull ? 'disabled' : ''}`}
                    onClick={() => !isFull && setSlotNumber(slot.slotNumber)}
                  >
                    <div className="judge-slot-row-inner">
                      <input
                        type="radio"
                        name="slot"
                        disabled={isFull}
                        checked={isSelected}
                        onChange={() => setSlotNumber(slot.slotNumber)}
                      />
                      <div>
                        <p className="judge-slot-title">{isFull ? 'Slot (full)' : `Slot ${slot.slotNumber}`}</p>
                        <p className="judge-slot-meta">
                          {new Date(slot.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          · {slot.startTime} – {slot.endTime}
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
          </FormField>
        </FormGrid>
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
    </FormLayout>
  );
};

export default JudgeOnboardingPage;
