import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllEventsApi,
  transitionStatusApi,
  deleteEventApi,
  extendRegistrationDeadlineApi,
} from '../../api/eventApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

const BADGE_CLASS = {
  draft:     'badge-draft',
  open:      'badge-open',
  assigning: 'badge-assigning',
  judging:   'badge-judging',
  completed: 'badge-completed',
};

const NEXT_STATUS = {
  draft:     'open',
  open:      'assigning',
  assigning: 'judging',
  judging:   'completed',
};

const NEXT_LABEL = {
  draft:     '▶ Open Registrations',
  open:      '⏭ Close & Assign',
  assigning: '⚖ Start Judging',
  judging:   '✓ Mark Completed',
};

/** Confirmation copy keyed by the status you are moving *into* */
const TRANSITION_CONFIRM = {
  open: {
    title: 'Open registrations?',
    message:
      'Participants will be able to register until the registration deadline. You can extend the deadline later while registrations are open.',
    confirmLabel: 'Open registrations',
    variant: 'primary',
  },
  assigning: {
    title: 'Close registrations and move to assignment?',
    message:
      'New team registrations will stop. You will assign teams to judges before judging starts. This step is hard to undo — continue?',
    confirmLabel: 'Close & assign',
    variant: 'danger',
  },
  judging: {
    title: 'Start judging?',
    message:
      'Judges will be able to submit evaluations. Ensure assignments are in good shape. Continue?',
    confirmLabel: 'Start judging',
    variant: 'primary',
  },
  completed: {
    title: 'Mark event as completed?',
    message:
      'This marks the event as finished. Continue?',
    confirmLabel: 'Mark completed',
    variant: 'danger',
  },
};

const formatEventDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
};

const CoordinatorDashboard = () => {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [transitionDialog, setTransitionDialog] = useState({
    open: false,
    eventId: null,
    nextStatus: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [extendModal, setExtendModal] = useState({
    open: false,
    eventId: null,
    date: '',
    saving: false,
    extendError: '',
  });

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

  const runTransition = async () => {
    const { eventId, nextStatus } = transitionDialog;
    if (!eventId || !nextStatus) return;
    setTransitionDialog({ open: false, eventId: null, nextStatus: null });
    try {
      await transitionStatusApi(eventId, nextStatus);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const runDelete = async () => {
    const id = deleteDialog.id;
    if (!id) return;
    setDeleteDialog({ open: false, id: null });
    try {
      await deleteEventApi(id);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const openExtendModal = (ev) => {
    const raw = ev.registrationDeadline
      ? new Date(ev.registrationDeadline).toISOString().slice(0, 10)
      : '';
    setExtendModal({
      open: true,
      eventId: ev._id,
      date: raw,
      saving: false,
      extendError: '',
    });
  };

  const saveExtendedDeadline = async () => {
    if (!extendModal.date) {
      setExtendModal((m) => ({ ...m, extendError: 'Pick a new deadline date' }));
      return;
    }
    setExtendModal((m) => ({ ...m, saving: true, extendError: '' }));
    try {
      await extendRegistrationDeadlineApi(extendModal.eventId, extendModal.date);
      setExtendModal({ open: false, eventId: null, date: '', saving: false, extendError: '' });
      fetchEvents();
    } catch (err) {
      setExtendModal((m) => ({
        ...m,
        saving: false,
        extendError: err.response?.data?.message || 'Could not update deadline',
      }));
    }
  };

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading your events…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h2 className="gradient-text">Coordinator Dashboard</h2>
          <p>Welcome back, {user?.name} 👋</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => navigate('/coordinator/events/create')} className="btn btn-primary">
            ✦ Create Event
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

      {events.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎪</div>
          <h3>No events yet</h3>
          <p>Create your first event to get started</p>
          <button onClick={() => navigate('/coordinator/events/create')} className="btn btn-primary">
            ✦ Create Event
          </button>
        </div>
      )}

      {/* Event Cards */}
      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((event) => (
          <div key={event._id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ marginBottom: 8 }}>{event.title}</h3>
                <span className={`badge ${BADGE_CLASS[event.status] || 'badge-draft'}`}>
                  {event.status?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {NEXT_STATUS[event.status] && (
                  <button
                    type="button"
                    onClick={() =>
                      setTransitionDialog({
                        open: true,
                        eventId: event._id,
                        nextStatus: NEXT_STATUS[event.status],
                      })
                    }
                    className="btn btn-primary btn-sm"
                  >
                    {NEXT_LABEL[event.status]}
                  </button>
                )}
                {event.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => openExtendModal(event)}
                    className="btn btn-secondary btn-sm"
                  >
                    Extend deadline
                  </button>
                )}
                <button
                  onClick={() => navigate(`/coordinator/events/${event._id}/registrations`)}
                  className="btn btn-secondary btn-sm"
                >
                  Registrations
                </button>
                {(event.status === 'judging' || event.status === 'completed') && (
                  <button
                    onClick={() => navigate(`/coordinator/events/${event._id}/results`)}
                    className="btn btn-secondary btn-sm"
                  >
                    Results
                  </button>
                )}
                {event.status === 'assigning' && (
                  <button
                    onClick={() => navigate(`/coordinator/events/${event._id}/assign`)}
                    className="btn btn-primary btn-sm"
                  >
                    Assign Teams
                  </button>
                )}
                {event.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => setDeleteDialog({ open: true, id: event._id })}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Domains */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {event.domains.map((d) => (
                <span key={d} className="domain-tag">{d}</span>
              ))}
            </div>

            {/* Slots summary */}
            {(event.eventStartDate || event.eventEndDate || event.registrationDeadline) && (
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {event.eventStartDate && (
                  <span style={{ marginRight: 14 }}>
                    <strong>Event starts:</strong> {formatEventDate(event.eventStartDate)}
                  </span>
                )}
                {event.eventEndDate && (
                  <span style={{ marginRight: 14 }}>
                    <strong>Event ends:</strong> {formatEventDate(event.eventEndDate)}
                  </span>
                )}
                {event.registrationDeadline && (
                  <span>
                    <strong>Reg. deadline:</strong> {formatEventDate(event.registrationDeadline)}
                  </span>
                )}
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {event.slots?.map((s) => (
                <span key={s.slotNumber}>
                  <strong>Slot {s.slotNumber}:</strong>{' '}
                  {new Date(s.date).toLocaleDateString()} · {s.startTime}–{s.endTime}{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>({s.judgeCount}/25)</span>
                </span>
              ))}
            </div>

            {/* Rubric summary */}
            {event.rubric?.criteria?.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong>Rubric:</strong>{' '}
                {event.rubric.criteria.map((c) => `${c.name} (${c.maxScore}pts)`).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={transitionDialog.open && !!transitionDialog.nextStatus}
        title={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.title || 'Confirm'}
        message={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.message || ''}
        confirmLabel={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.confirmLabel || 'Confirm'}
        variant={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.variant || 'primary'}
        onConfirm={runTransition}
        onCancel={() =>
          setTransitionDialog({ open: false, eventId: null, nextStatus: null })
        }
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete this event?"
        message="This permanently removes the event. It only works for drafts."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={runDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />

      {extendModal.open && (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={() =>
            !extendModal.saving &&
            setExtendModal({ open: false, eventId: null, date: '', saving: false, extendError: '' })
          }
        >
          <div
            className="confirm-dialog glass-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="extend-deadline-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="extend-deadline-title" className="confirm-dialog-title">
              Extend registration deadline
            </h3>
            <p className="confirm-dialog-message">
              Set a new last day for teams to register. Must be today or a future calendar date.
            </p>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="extend-deadline-input">
                New deadline
              </label>
              <input
                id="extend-deadline-input"
                type="date"
                className="form-input"
                value={extendModal.date}
                onChange={(e) =>
                  setExtendModal((m) => ({ ...m, date: e.target.value, extendError: '' }))
                }
                disabled={extendModal.saving}
              />
            </div>
            {extendModal.extendError && (
              <div className="alert alert-danger" style={{ marginBottom: 12 }}>
                {extendModal.extendError}
              </div>
            )}
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={extendModal.saving}
                onClick={() =>
                  setExtendModal({ open: false, eventId: null, date: '', saving: false, extendError: '' })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={extendModal.saving}
                onClick={saveExtendedDeadline}
              >
                {extendModal.saving ? 'Saving…' : 'Save new deadline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CoordinatorDashboard;