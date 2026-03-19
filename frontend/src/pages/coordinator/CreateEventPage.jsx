import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEventApi } from '../../api/eventApi';

// ── Step indicators ───────────────────────────────────────────
const steps = ['Event Details', 'Judging Slots', 'Rubric'];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Form state ────────────────────────────────────────────
  const [details, setDetails] = useState({
    title:                '',
    description:          '',
    registrationDeadline: '',
    domainInput:          '',   // current input for adding a domain tag
    domains:              [],
  });

  const [slots, setSlots] = useState([
    { slotNumber: 1, date: '', startTime: '' },
    { slotNumber: 2, date: '', startTime: '' },
    { slotNumber: 3, date: '', startTime: '' },
  ]);

  const [criteria, setCriteria] = useState([
    { name: '', maxScore: '' },
  ]);

  // ── Domain tag helpers ────────────────────────────────────
  const addDomain = () => {
    const val = details.domainInput.trim();
    if (!val || details.domains.includes(val)) return;
    setDetails((p) => ({ ...p, domains: [...p.domains, val], domainInput: '' }));
  };

  const removeDomain = (d) =>
    setDetails((p) => ({ ...p, domains: p.domains.filter((x) => x !== d) }));

  // ── Slot helpers ──────────────────────────────────────────
  const updateSlot = (index, field, value) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ── Rubric helpers ────────────────────────────────────────
  const addCriterion  = () => setCriteria((p) => [...p, { name: '', maxScore: '' }]);
  const removeCriterion = (i) => setCriteria((p) => p.filter((_, idx) => idx !== i));
  const updateCriterion = (i, field, value) => {
    setCriteria((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  // ── Step validation before advancing ─────────────────────
  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!details.title.trim())       return setError('Title is required') || false;
      if (details.domains.length === 0) return setError('Add at least one domain') || false;
    }
    if (step === 1) {
      for (const s of slots) {
        if (!s.date || !s.startTime) return setError('All 3 slots need a date and start time') || false;
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

  // ── Final submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');
    try {
      await createEventApi({
        title:                details.title,
        description:          details.description,
        domains:              details.domains,
        registrationDeadline: details.registrationDeadline || undefined,
        slots,
        rubric: {
          criteria: criteria.map((c) => ({
            name:     c.name,
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

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 1rem' }}>
      <h2>Create New Event</h2>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            flex: 1, padding: '8px 0', textAlign: 'center',
            borderBottom: `3px solid ${i === step ? '#4F46E5' : '#e0e0e0'}`,
            color: i === step ? '#4F46E5' : '#999', fontSize: 13, fontWeight: i === step ? 600 : 400,
          }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}

      {/* ── Step 0: Event Details ── */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Event Title *</label>
            <input value={details.title} onChange={(e) => setDetails((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Technovate 2025" style={inputStyle} />
          </div>
          <div>
            <label>Description</label>
            <textarea value={details.description} onChange={(e) => setDetails((p) => ({ ...p, description: e.target.value }))}
              placeholder="What is this event about?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label>Registration Deadline</label>
            <input type="date" value={details.registrationDeadline}
              onChange={(e) => setDetails((p) => ({ ...p, registrationDeadline: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label>Domains *</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input value={details.domainInput}
                onChange={(e) => setDetails((p) => ({ ...p, domainInput: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                placeholder="e.g. AI/ML — press Enter or click Add"
                style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
              <button type="button" onClick={addDomain} style={secondaryBtn}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {details.domains.map((d) => (
                <span key={d} style={tagStyle}>
                  {d}
                  <button onClick={() => removeDomain(d)} style={tagRemoveBtn}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Judging Slots ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
            Create 3 offline judging slots. Each slot is 3 hours long.
          </p>
          {slots.map((slot, i) => (
            <div key={i} style={{ padding: 16, border: '1px solid #e0e0e0', borderRadius: 8 }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Slot {slot.slotNumber}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13 }}>Date</label>
                  <input type="date" value={slot.date}
                    onChange={(e) => updateSlot(i, 'date', e.target.value)}
                    style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13 }}>Start Time</label>
                  <input type="time" value={slot.startTime}
                    onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    style={inputStyle} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 2: Rubric ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
            Define the judging criteria. Judges will score each team on these.
          </p>
          {criteria.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 13 }}>Criterion Name</label>
                <input value={c.name}
                  onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                  placeholder="e.g. Innovation" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13 }}>Max Score</label>
                <input type="number" min={1} value={c.maxScore}
                  onChange={(e) => updateCriterion(i, 'maxScore', e.target.value)}
                  placeholder="10" style={inputStyle} />
              </div>
              {criteria.length > 1 && (
                <button onClick={() => removeCriterion(i)}
                  style={{ ...secondaryBtn, color: 'red', borderColor: 'red', marginBottom: 1 }}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button onClick={addCriterion} style={secondaryBtn}>+ Add Criterion</button>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        {step > 0
          ? <button onClick={back} style={secondaryBtn}>← Back</button>
          : <div />
        }
        {step < 2
          ? <button onClick={next} style={primaryBtn}>Next →</button>
          : <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
        }
      </div>
    </div>
  );
};

const inputStyle = {
  display: 'block', width: '100%', padding: '9px 12px', marginTop: 4,
  border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
};
const primaryBtn = {
  padding: '10px 24px', background: '#4F46E5', color: '#fff',
  border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer',
};
const secondaryBtn = {
  padding: '9px 16px', background: 'transparent', color: '#4F46E5',
  border: '1px solid #4F46E5', borderRadius: 6, fontSize: 14, cursor: 'pointer',
};
const tagStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '4px 10px', background: '#EEF2FF', color: '#4F46E5',
  borderRadius: 20, fontSize: 13,
};
const tagRemoveBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#4F46E5', fontSize: 16, lineHeight: 1, padding: 0,
};

export default CreateEventPage;