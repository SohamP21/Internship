import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEventApi } from '../../api/eventApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

const steps = ['Event Details', 'Judging Slots', 'Rubric'];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const [details, setDetails] = useState({
    title: '',
    description: '',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    domainInput: '',
    domains: [],
  });
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);

  const [slots, setSlots] = useState([
    { slotNumber: 1, date: '', startTime: '', endTime: '' },
  ]);

  const [criteria, setCriteria] = useState([
    { name: '', maxScore: '' },
  ]);

  const addDomain = () => {
    const val = details.domainInput.trim();
    if (!val || details.domains.includes(val)) return;
    setDetails((p) => ({ ...p, domains: [...p.domains, val], domainInput: '' }));
  };

  const removeDomain = (d) =>
    setDetails((p) => ({ ...p, domains: p.domains.filter((x) => x !== d) }));

  const updateSlot = (index, field, value) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { slotNumber: prev.length + 1, date: '', startTime: '', endTime: '' },
    ]);
  };

  const removeSlot = (index) => {
    setSlots((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, slotNumber: i + 1 }))
    );
  };

  const addCriterion  = () => setCriteria((p) => [...p, { name: '', maxScore: '' }]);
  const removeCriterion = (i) => setCriteria((p) => p.filter((_, idx) => idx !== i));
  const updateCriterion = (i, field, value) => {
    setCriteria((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!details.title.trim())       return setError('Title is required') || false;
      if (details.domains.length === 0) return setError('Add at least one domain') || false;
    }
    if (step === 1) {
      if (slots.length === 0) return setError('Add at least one judging slot') || false;
      for (const s of slots) {
        if (!s.date || !s.startTime || !s.endTime) return setError('All slots need a date, start time, and end time') || false;
      }
    }
    if (step === 2) {
      for (const c of criteria) {
        if (!c.name.trim())  return setError('All criteria need a name') || false;
        if (!c.maxScore || Number(c.maxScore) < 1)
          return setError('All criteria need a max score of at least 1') || false;
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setError(''); setStep((s) => s - 1); };

  const performCreate = async () => {
    setCreateConfirmOpen(false);
    setLoading(true);
    setError('');
    try {
      await createEventApi({
        title: details.title,
        description: details.description,
        domains: details.domains,
        registrationDeadline: details.registrationDeadline || undefined,
        eventStartDate: details.eventStartDate || undefined,
        eventEndDate: details.eventEndDate || undefined,
        slots,
        rubric: {
          criteria: criteria.map((c) => ({
            name: c.name,
            maxScore: Number(c.maxScore),
          })),
        },
      });
      navigate('/coordinator/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    setCreateConfirmOpen(true);
  };

  return (
    <Layout maxWidth="narrow">
      <button onClick={() => navigate('/coordinator/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>
      <h2 className="gradient-text" style={{ marginBottom: 8 }}>Create New Event</h2>

      {/* Step Indicator */}
      <div className="step-indicator">
        {steps.map((s, i) => (
          <div key={s} className={`step-item ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
            {i < step ? '✓' : i + 1}. {s}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>⚠ {error}</div>}

      {/* Step 0: Event Details */}
      {step === 0 && (
        <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input value={details.title}
              onChange={(e) => setDetails((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Technovate 2025" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={details.description}
              onChange={(e) => setDetails((p) => ({ ...p, description: e.target.value }))}
              placeholder="What is this event about?" rows={3} className="form-textarea" />
          </div>
          <div className="form-group">
            <label className="form-label">Event start date</label>
            <input
              type="date"
              value={details.eventStartDate}
              onChange={(e) => setDetails((p) => ({ ...p, eventStartDate: e.target.value }))}
              className="form-input"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Optional overall window for the competition (shown on your dashboard).
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Event end date</label>
            <input
              type="date"
              value={details.eventEndDate}
              onChange={(e) => setDetails((p) => ({ ...p, eventEndDate: e.target.value }))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Registration deadline</label>
            <input type="date" value={details.registrationDeadline}
              onChange={(e) => setDetails((p) => ({ ...p, registrationDeadline: e.target.value }))}
              className="form-input" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              After this calendar day, new team sign-ups are blocked unless you extend it while open.
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Domains *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={details.domainInput}
                onChange={(e) => setDetails((p) => ({ ...p, domainInput: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                placeholder="e.g. AI/ML — press Enter or click Add"
                className="form-input" style={{ flex: 1 }} />
              <button type="button" onClick={addDomain} className="btn btn-secondary btn-sm">Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {details.domains.map((d) => (
                <span key={d} className="domain-tag removable">
                  {d}
                  <button onClick={() => removeDomain(d)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Judging Slots */}
      {step === 1 && (
        <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Create judging slots with start and end times. Add as many as you need.
          </p>
          {slots.map((slot, i) => (
            <div key={i} className="glass-card no-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong style={{ fontSize: '0.9rem' }}>Slot {slot.slotNumber}</strong>
                {slots.length > 1 && (
                  <button type="button" onClick={() => removeSlot(i)} className="btn btn-danger btn-sm">
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Date</label>
                  <input type="date" value={slot.date}
                    onChange={(e) => updateSlot(i, 'date', e.target.value)}
                    className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Time</label>
                  <input type="time" value={slot.startTime}
                    onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    className="form-input" />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>End Time</label>
                  <input type="time" value={slot.endTime}
                    onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                    className="form-input" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSlot} className="btn btn-secondary">+ Add Slot</button>
        </div>
      )}

      {/* Step 2: Rubric */}
      {step === 2 && (
        <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Define the judging criteria. Judges will score each team on these.
          </p>
          {criteria.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Criterion Name</label>
                <input value={c.name}
                  onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                  placeholder="e.g. Innovation" className="form-input" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Max Score</label>
                <input type="number" min={1} value={c.maxScore}
                  onChange={(e) => updateCriterion(i, 'maxScore', e.target.value)}
                  placeholder="10" className="form-input" />
              </div>
              {criteria.length > 1 && (
                <button onClick={() => removeCriterion(i)} className="btn btn-danger btn-sm" style={{ marginBottom: 2 }}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button onClick={addCriterion} className="btn btn-secondary">+ Add Criterion</button>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
        {step > 0
          ? <button onClick={back} className="btn btn-ghost">← Back</button>
          : <div />
        }
        {step < 2
          ? <button type="button" onClick={next} className="btn btn-primary">Next →</button>
          : <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary">
              {loading ? 'Creating…' : '✦ Create Event'}
            </button>
        }
      </div>

      <ConfirmDialog
        open={createConfirmOpen}
        title="Create this event?"
        message="You can still delete it while it is in draft. After you open registrations, changes are limited."
        confirmLabel="Create event"
        cancelLabel="Go back"
        variant="primary"
        onConfirm={performCreate}
        onCancel={() => setCreateConfirmOpen(false)}
      />
    </Layout>
  );
};

export default CreateEventPage;