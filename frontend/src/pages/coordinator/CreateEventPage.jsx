import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { createEventApi } from '../../api/eventApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormLayout from '../../components/forms/FormLayout';
import FormGrid from '../../components/forms/FormGrid';
import FormField from '../../components/forms/FormField';
import { useStepper } from '../../hooks/useStepper';
import {
  addDaysYmd,
  getTodayYmdUTC,
  getTomorrowYmdUTC,
  validateEventFormDates,
} from '../../lib/eventDateRules';
import { HALF_HOUR_TIME_OPTIONS, minutesFromHHMM } from '../../lib/halfHourTimeOptions';

const STEP_LABELS = ['Basic Info', 'Schedule', 'Judging Setup'];

const stepMotion = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { x: -20, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { currentStep: step, goNext, goBack, isFirst, isLast } = useStepper(3);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tomorrowStr = useMemo(() => getTomorrowYmdUTC(), []);
  const todayStr = useMemo(() => getTodayYmdUTC(), []);

  const [details, setDetails] = useState({
    title: '',
    description: '',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    domainInput: '',
    domains: [],
  });
  const [dateFieldErrors, setDateFieldErrors] = useState({
    eventStartDate: '',
    eventEndDate: '',
    registrationDeadline: '',
  });

  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);

  const [slots, setSlots] = useState([{ slotNumber: 1, date: '', startTime: '', endTime: '' }]);
  const [slotTimeErrors, setSlotTimeErrors] = useState({});

  const [criteria, setCriteria] = useState([{ name: '', maxScore: '', weight: '' }]);
  const [criterionWeightErrors, setCriterionWeightErrors] = useState({});

  const minEndDate = details.eventStartDate ? addDaysYmd(details.eventStartDate, 1) : '';
  const maxRegDeadline = details.eventStartDate ? addDaysYmd(details.eventStartDate, -1) : '';

  const addDomain = () => {
    const val = details.domainInput.trim();
    if (!val || details.domains.includes(val)) return;
    setDetails((p) => ({ ...p, domains: [...p.domains, val], domainInput: '' }));
  };

  const removeDomain = (d) => setDetails((p) => ({ ...p, domains: p.domains.filter((x) => x !== d) }));

  const updateSlot = (index, field, value) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setSlotTimeErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
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
    setSlotTimeErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const i = Number(k);
        if (i < index) next[i] = prev[i];
        else if (i > index) next[i - 1] = prev[i];
      });
      return next;
    });
  };

  const addCriterion = () => setCriteria((p) => [...p, { name: '', maxScore: '', weight: '' }]);
  const removeCriterion = (i) => {
    setCriteria((p) => p.filter((_, idx) => idx !== i));
    setCriterionWeightErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const idx = Number(k);
        if (idx < i) next[idx] = prev[idx];
        else if (idx > i) next[idx - 1] = prev[idx];
      });
      return next;
    });
  };
  const updateCriterion = (i, field, value) => {
    setCriteria((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
    if (field === 'weight') {
      setCriterionWeightErrors((prev) => {
        const next = { ...prev };
        delete next[i];
        return next;
      });
    }
  };

  const refreshDateErrors = (nextDetails) => {
    const v = validateEventFormDates({
      eventStartDate: nextDetails.eventStartDate,
      eventEndDate: nextDetails.eventEndDate,
      registrationDeadline: nextDetails.registrationDeadline,
    });
    if (v.ok) {
      setDateFieldErrors({ eventStartDate: '', eventEndDate: '', registrationDeadline: '' });
      return true;
    }
    setDateFieldErrors({
      eventStartDate: v.fields?.eventStartDate || '',
      eventEndDate: v.fields?.eventEndDate || '',
      registrationDeadline: v.fields?.registrationDeadline || '',
    });
    return false;
  };

  const validateSlotsDetailed = () => {
    const errs = {};
    let ok = true;
    if (!details.eventStartDate || !details.eventEndDate) {
      setError('Set event start and end dates before configuring slots.');
      return false;
    }
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.date || !s.startTime || !s.endTime) {
        ok = false;
        errs[i] = 'Date, start time, and end time are required.';
        continue;
      }
      if (s.date < details.eventStartDate || s.date > details.eventEndDate) {
        ok = false;
        errs[i] = 'Slot date must fall within the event start and end dates.';
        continue;
      }
      const sm = minutesFromHHMM(s.startTime);
      const em = minutesFromHHMM(s.endTime);
      if (sm == null || em == null) {
        ok = false;
        errs[i] = 'Invalid time values.';
        continue;
      }
      if (em <= sm) {
        ok = false;
        errs[i] = 'End time must be after start time on the same date.';
      }
    }
    setSlotTimeErrors(errs);
    return ok;
  };

  const validateRubricWeights = () => {
    const next = {};
    let ok = true;
    criteria.forEach((c, i) => {
      if (c.weight === '' || c.weight == null) return;
      const w = Number(c.weight);
      if (Number.isNaN(w) || w < 0 || w > 100) {
        next[i] = 'Weight must be between 0 and 100.';
        ok = false;
      }
    });
    setCriterionWeightErrors(next);
    return ok;
  };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!details.title.trim()) return setError('Title is required') || false;
      if (details.domains.length === 0) return setError('Add at least one domain') || false;
      if (!details.eventStartDate) return setError('Event start date is required') || false;
      if (!details.eventEndDate) return setError('Event end date is required') || false;
      if (!details.registrationDeadline) return setError('Registration deadline is required') || false;
      if (!refreshDateErrors(details)) {
        setError('Fix the date fields highlighted below.');
        return false;
      }
    }
    if (step === 1) {
      if (slots.length === 0) return setError('Add at least one judging slot') || false;
      if (!validateSlotsDetailed()) {
        setError('Fix slot dates and times below.');
        return false;
      }
    }
    if (step === 2) {
      if (!validateRubricWeights()) {
        setError('Fix rubric weights below.');
        return false;
      }
      for (const c of criteria) {
        if (!c.name.trim()) return setError('All criteria need a name') || false;
        if (!c.maxScore || Number(c.maxScore) < 1)
          return setError('All criteria need a max score of at least 1') || false;
      }
    }
    return true;
  };

  const next = () => {
    if (validateStep()) goNext();
  };

  const back = () => {
    setError('');
    goBack();
  };

  const performCreate = async () => {
    setCreateConfirmOpen(false);
    setLoading(true);
    setError('');
    if (!refreshDateDetails()) {
      setLoading(false);
      return;
    }
    if (!validateSlotsDetailed() || !validateRubricWeights()) {
      setError('Fix validation errors before creating the event.');
      setLoading(false);
      return;
    }
    try {
      await createEventApi({
        title: details.title,
        description: details.description,
        domains: details.domains,
        registrationDeadline: details.registrationDeadline,
        eventStartDate: details.eventStartDate,
        eventEndDate: details.eventEndDate,
        slots,
        rubric: {
          criteria: criteria.map((c) => {
            const row = {
              name: c.name,
              maxScore: Number(c.maxScore),
            };
            const w = c.weight === '' || c.weight == null ? null : Number(c.weight);
            if (w != null && !Number.isNaN(w)) row.weight = w;
            return row;
          }),
        },
      });
      navigate('/coordinator/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  function refreshDateDetails() {
    const v = validateEventFormDates({
      eventStartDate: details.eventStartDate,
      eventEndDate: details.eventEndDate,
      registrationDeadline: details.registrationDeadline,
    });
    if (!v.ok) {
      setDateFieldErrors({
        eventStartDate: v.fields?.eventStartDate || '',
        eventEndDate: v.fields?.eventEndDate || '',
        registrationDeadline: v.fields?.registrationDeadline || '',
      });
      setError(v.message || 'Invalid dates');
      return false;
    }
    setDateFieldErrors({ eventStartDate: '', eventEndDate: '', registrationDeadline: '' });
    return true;
  }

  const handleSubmit = () => {
    if (!validateStep()) return;
    if (!refreshDateDetails()) return;
    if (!validateSlotsDetailed()) {
      setError('Fix slot times before submitting.');
      return;
    }
    if (!validateRubricWeights()) {
      setError('Fix rubric weights before submitting.');
      return;
    }
    setCreateConfirmOpen(true);
  };

  const previewTitle = details.title.trim() || 'Event title';
  const previewDesc = details.description.trim() || 'Description will appear here for participants.';
  const dateHint = [details.eventStartDate, details.eventEndDate].filter(Boolean).join(' → ');

  const leftPreview = (
    <>
      <p className="form-preview-label">Preview</p>
      <div className="form-preview-card">
        <h3 className="form-preview-card__title">{previewTitle}</h3>
        <p className="form-preview-card__desc">{previewDesc}</p>
        {dateHint ? <p className="form-preview-card__meta">{dateHint}</p> : null}
        {details.domains.length > 0 ? (
          <div className="form-preview-tags">
            {details.domains.map((d) => (
              <span key={d} className="form-preview-tag">
                {d}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  const rightHeader = (
    <div className="form-step-strip" role="navigation" aria-label="Form steps">
      {STEP_LABELS.map((label, i) => (
        <span
          key={label}
          className={`form-step-pill ${i === step ? 'form-step-pill--active' : ''} ${
            i < step ? 'form-step-pill--done' : ''
          }`}
        >
          {i < step ? '✓ ' : ''}
          {label}
        </span>
      ))}
    </div>
  );

  const footer = (
    <div className="form-shell__footer form-shell__footer--split">
      <div>
        {!isFirst ? (
          <button type="button" onClick={back} className="btn btn-ghost">
            ← Back
          </button>
        ) : (
          <button type="button" onClick={() => navigate('/coordinator/dashboard')} className="btn btn-ghost">
            Cancel
          </button>
        )}
      </div>
      <div>
        {!isLast ? (
          <button type="button" onClick={next} className="btn btn-primary">
            Next →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary">
            {loading ? 'Creating…' : 'Create Event'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <FormLayout
      leftTitle="Create event"
      leftSubtitle="Students will see the preview on the left as you type."
      leftContent={leftPreview}
      rightHeader={rightHeader}
      footer={footer}
    >
      {error ? <div className="alert alert-danger alert-spacing">{error}</div> : null}

      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="step0"
            className="form-step-motion"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <FormGrid>
              <FormField label="Event title *" htmlFor="ce-title" spanFull>
                <input
                  id="ce-title"
                  value={details.title}
                  onChange={(e) => setDetails((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Technovate 2025"
                  className="form-input"
                />
              </FormField>

              <FormField label="Event start *" htmlFor="ce-start" error={dateFieldErrors.eventStartDate}>
                <input
                  id="ce-start"
                  type="date"
                  min={tomorrowStr}
                  value={details.eventStartDate}
                  onChange={(e) => {
                    const next = { ...details, eventStartDate: e.target.value };
                    setDetails(next);
                    refreshDateErrors(next);
                  }}
                  className="form-input"
                />
                {dateFieldErrors.eventStartDate ? (
                  <p className="form-inline-error">{dateFieldErrors.eventStartDate}</p>
                ) : null}
              </FormField>

              <FormField label="Event end *" htmlFor="ce-end" error={dateFieldErrors.eventEndDate}>
                <input
                  id="ce-end"
                  type="date"
                  disabled={!details.eventStartDate}
                  min={minEndDate || tomorrowStr}
                  value={details.eventEndDate}
                  onChange={(e) => {
                    const next = { ...details, eventEndDate: e.target.value };
                    setDetails(next);
                    refreshDateErrors(next);
                  }}
                  className="form-input"
                />
                {dateFieldErrors.eventEndDate ? (
                  <p className="form-inline-error">{dateFieldErrors.eventEndDate}</p>
                ) : null}
              </FormField>

              <FormField
                label="Registration deadline *"
                htmlFor="ce-deadline"
                spanFull
                error={dateFieldErrors.registrationDeadline}
              >
                <input
                  id="ce-deadline"
                  type="date"
                  disabled={!details.eventStartDate}
                  min={todayStr}
                  max={maxRegDeadline || undefined}
                  value={details.registrationDeadline}
                  onChange={(e) => {
                    const next = { ...details, registrationDeadline: e.target.value };
                    setDetails(next);
                    refreshDateErrors(next);
                  }}
                  className="form-input"
                />
                {dateFieldErrors.registrationDeadline ? (
                  <p className="form-inline-error">{dateFieldErrors.registrationDeadline}</p>
                ) : null}
                <p className="form-hint">Must be on or before the day before the event starts.</p>
              </FormField>

              <FormField label="Description" htmlFor="ce-desc" spanFull>
                <textarea
                  id="ce-desc"
                  value={details.description}
                  onChange={(e) => setDetails((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What is this event about?"
                  rows={3}
                  className="form-textarea"
                />
              </FormField>

              <FormField label="Domains / tags *" htmlFor="ce-domain" spanFull>
                <div className="form-inline-add">
                  <input
                    id="ce-domain"
                    value={details.domainInput}
                    onChange={(e) => setDetails((p) => ({ ...p, domainInput: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                    placeholder="e.g. AI/ML — Enter to add"
                    className="form-input"
                  />
                  <button type="button" onClick={addDomain} className="btn btn-secondary btn-sm">
                    Add
                  </button>
                </div>
                <div className="coop-tag-row domain-tags-flow">
                  {details.domains.map((d) => (
                    <span key={d} className="domain-tag removable">
                      {d}
                      <button type="button" onClick={() => removeDomain(d)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </FormField>
            </FormGrid>
          </motion.div>
        ) : null}

        {step === 1 ? (
          <motion.div
            key="step1"
            className="form-step-motion"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <p className="form-section-label">Judging slots</p>
            <p className="form-hint mb-1">Date and 30-minute time windows (within the event dates).</p>
            {slots.map((slot, i) => (
              <div key={i} className="form-slot-block glass-card no-hover">
                <p className="form-hint mb-1">Slot {slot.slotNumber}</p>
                <FormGrid>
                  <FormField label="Date" htmlFor={`slot-d-${i}`}>
                    <input
                      id={`slot-d-${i}`}
                      type="date"
                      disabled={!details.eventStartDate || !details.eventEndDate}
                      min={details.eventStartDate || undefined}
                      max={details.eventEndDate || undefined}
                      value={slot.date}
                      onChange={(e) => updateSlot(i, 'date', e.target.value)}
                      className="form-input"
                    />
                  </FormField>
                  <FormField label="Start time" htmlFor={`slot-s-${i}`}>
                    <select
                      id={`slot-s-${i}`}
                      className="form-input"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    >
                      <option value="">Select…</option>
                      {HALF_HOUR_TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="End time" htmlFor={`slot-e-${i}`}>
                    <select
                      id={`slot-e-${i}`}
                      className="form-input"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
                    >
                      <option value="">Select…</option>
                      {HALF_HOUR_TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label=" ">
                    {slots.length > 1 ? (
                      <button type="button" onClick={() => removeSlot(i)} className="btn btn-danger btn-sm">
                        Remove
                      </button>
                    ) : (
                      <span className="form-hint"> </span>
                    )}
                  </FormField>
                </FormGrid>
                {slotTimeErrors[i] ? <p className="form-inline-error">{slotTimeErrors[i]}</p> : null}
              </div>
            ))}
            <button type="button" onClick={addSlot} className="btn btn-secondary btn-sm mt-nav">
              + Add slot
            </button>
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div
            key="step2"
            className="form-step-motion"
            variants={stepMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <p className="form-section-label">Rubric</p>
            <p className="form-hint mb-1">
              Max points per criterion; optional weights 0–100. Leave blank for equal importance.
            </p>
            {criteria.map((c, i) => (
              <FormGrid key={i} className="form-rubric-block">
                <FormField label="Criterion" htmlFor={`crit-n-${i}`}>
                  <input
                    id={`crit-n-${i}`}
                    value={c.name}
                    onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                    placeholder="e.g. Innovation"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Max points" htmlFor={`crit-m-${i}`}>
                  <input
                    id={`crit-m-${i}`}
                    type="number"
                    min={1}
                    value={c.maxScore}
                    onChange={(e) => updateCriterion(i, 'maxScore', e.target.value)}
                    placeholder="10"
                    className="form-input"
                  />
                </FormField>
                <FormField
                  label={
                    <span className="rubric-weight-head">
                      Weight (0-100)
                      <button
                        type="button"
                        className="rubric-weight-info"
                        title="Optional — give this criterion more importance in final ranking. Higher weight = more impact on score."
                        aria-label="Weight help"
                      >
                        <Info size={14} strokeWidth={2} aria-hidden />
                      </button>
                    </span>
                  }
                  htmlFor={`crit-w-${i}`}
                >
                  <input
                    id={`crit-w-${i}`}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={c.weight}
                    onChange={(e) => updateCriterion(i, 'weight', e.target.value)}
                    placeholder="Weight (0-100)"
                    className="form-input"
                  />
                  {criterionWeightErrors[i] ? (
                    <p className="form-inline-error">{criterionWeightErrors[i]}</p>
                  ) : null}
                </FormField>
                <FormField label=" ">
                  {criteria.length > 1 ? (
                    <button type="button" onClick={() => removeCriterion(i)} className="btn btn-danger btn-sm">
                      Remove
                    </button>
                  ) : (
                    <span className="form-hint"> </span>
                  )}
                </FormField>
              </FormGrid>
            ))}
            <button type="button" onClick={addCriterion} className="btn btn-secondary btn-sm">
              + Add criterion
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
    </FormLayout>
  );
};

export default CreateEventPage;
