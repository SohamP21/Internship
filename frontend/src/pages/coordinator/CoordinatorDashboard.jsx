import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Gavel, CheckCircle } from 'lucide-react';
import {
  getAllEventsApi,
  transitionStatusApi,
  deleteEventApi,
  extendRegistrationDeadlineApi,
} from '../../api/eventApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import DashboardSkeleton from '../../components/coordinator/DashboardSkeleton';
import EmptyState from '../../components/coordinator/EmptyState';
import PageShell from '../../components/ui/PageShell';
import HeroBanner from '../../components/ui/HeroBanner';
import StatCard from '../../components/ui/StatCard';
import EventCard from '../../components/ui/EventCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { useToast } from '../../context/ToastContext';

const NEXT_STATUS = {
  draft: 'open',
  open: 'assigning',
  assigning: 'judging',
  judging: 'completed',
};

const NEXT_LABEL = {
  draft: 'Open registrations',
  open: 'Close & Assign',
  assigning: 'Start Judging',
  judging: 'Mark Completed',
};

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
    message: 'This marks the event as finished. Continue?',
    confirmLabel: 'Mark completed',
    variant: 'danger',
  },
};

const formatShortDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
};

const slotAggregate = (event) => {
  const slots = event.slots || [];
  let filled = 0;
  const capPer = 25;
  for (const s of slots) {
    filled += Number(s.judgeCount) || 0;
  }
  const cap = slots.length * capPer;
  return { count: slots.length, filled, cap };
};

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { push: pushToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transitionBusyEventId, setTransitionBusyEventId] = useState(null);
  const [transitionBusyLabel, setTransitionBusyLabel] = useState('');

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
      const raw = res?.data?.data;
      setEvents(Array.isArray(raw) ? raw : []);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const stats = useMemo(() => {
    const out = { total: events.length, open: 0, judging: 0, completed: 0 };
    for (const e of events) {
      if (e.status === 'open') out.open += 1;
      else if (e.status === 'judging') out.judging += 1;
      else if (e.status === 'completed') out.completed += 1;
    }
    return out;
  }, [events]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [events]);

  const runTransition = async () => {
    const { eventId, nextStatus } = transitionDialog;
    if (!eventId || !nextStatus) return;
    setTransitionDialog({ open: false, eventId: null, nextStatus: null });

    const busyLabel =
      nextStatus === 'completed' ? 'Generating certificates...' : 'Updating...';
    setTransitionBusyEventId(eventId);
    setTransitionBusyLabel(busyLabel);

    try {
      const res = await transitionStatusApi(eventId, nextStatus);
      const payload = res?.data?.data;
      const cert = payload?.certificateIssuance;

      if (nextStatus === 'completed' && cert) {
        if (cert.error) {
          pushToast(
            'Event completed; certificate issuance encountered an error. Check server logs.',
            'error'
          );
        } else if (cert.attempted > 0) {
          pushToast(
            `Event completed! Certificates sent to all ${cert.attempted} students.`,
            'success'
          );
        } else {
          pushToast('Event completed! No registrations to issue certificates for.', 'success');
        }
      }

      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    } finally {
      setTransitionBusyEventId(null);
      setTransitionBusyLabel('');
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
      <Layout maxWidth="wide" viewport="command">
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout maxWidth="wide" viewport="command">
      <PageShell>
        <HeroBanner
          greeting={`Hello, ${user?.name?.split(' ')[0] || 'there'}`}
          subtitle="Manage registrations, assignments, and judging from one calm workspace."
          ctaLabel="Create event"
          ctaAction={() => navigate('/coordinator/events/create')}
        />

        <motion.div className="ds-stat-row ds-mt-24" variants={staggerContainer} initial={false} animate="visible">
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Calendar size={22} strokeWidth={2} />}
              label="Total events"
              value={stats.total}
              accentColor="orange"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Users size={22} strokeWidth={2} />}
              label="Open"
              value={stats.open}
              accentColor="green"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Gavel size={22} strokeWidth={2} />}
              label="Judging"
              value={stats.judging}
              accentColor="blue"
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<CheckCircle size={22} strokeWidth={2} />}
              label="Completed"
              value={stats.completed}
              accentColor="green"
            />
          </motion.div>
        </motion.div>

        <div className="ds-dash-grid ds-mt-24">
          <div>
            <span className="ds-events-section-title gradient-text">Your events</span>

            {error ? (
              <div className="alert alert-danger alert-spacing">{error}</div>
            ) : null}

            {sortedEvents.length === 0 ? (
              <EmptyState onCreate={() => navigate('/coordinator/events/create')} />
            ) : (
              <motion.div className="ds-events-grid" variants={staggerContainer} initial={false} animate="visible">
                {sortedEvents.map((event) => {
                  const agg = slotAggregate(event);
                  const registrationSummary =
                    agg.cap > 0 ? `${agg.filled} / ${agg.cap} registered` : `${agg.filled} registered`;
                  const start = formatShortDate(event.eventStartDate);
                  const end = formatShortDate(event.eventEndDate);
                  const deadline = formatShortDate(event.registrationDeadline);

                  const metaSegments = [];
                  if (start && end) metaSegments.push(`${start} – ${end}`);
                  else if (start || end) metaSegments.push(start || end);
                  if (deadline) metaSegments.push(`Reg. deadline ${deadline}`);
                  metaSegments.push(registrationSummary);

                  const primaryAction = NEXT_STATUS[event.status]
                    ? {
                        label: NEXT_LABEL[event.status],
                        onClick: () =>
                          setTransitionDialog({
                            open: true,
                            eventId: event._id,
                            nextStatus: NEXT_STATUS[event.status],
                          }),
                      }
                    : null;

                  const secondaryActions = [
                    {
                      label: 'Registrations',
                      onClick: () => navigate(`/coordinator/events/${event._id}/registrations`),
                    },
                    ...(event.status === 'assigning'
                      ? [
                          {
                            label: 'Assign Teams',
                            onClick: () => navigate(`/coordinator/events/${event._id}/assign`),
                          },
                        ]
                      : []),
                    ...((event.status === 'judging' || event.status === 'completed')
                      ? [
                          {
                            label: 'Results',
                            onClick: () => navigate(`/coordinator/events/${event._id}/results`),
                          },
                        ]
                      : []),
                    ...(event.status === 'draft'
                      ? [
                          {
                            label: 'Delete',
                            onClick: () => setDeleteDialog({ open: true, id: event._id }),
                          },
                        ]
                      : []),
                  ];

                  const subtleActions =
                    event.status === 'open' ? [{ label: 'Extend Deadline', onClick: () => openExtendModal(event) }] : [];

                  const hasSlots = (event.slots || []).length > 0;
                  const hasRubric = (event.rubric?.criteria || []).length > 0;
                  const expandContent =
                    hasSlots || hasRubric ? (
                      <>
                        {hasSlots ? (
                          <div className="ui-event-card__detail-block">
                            {(event.slots || []).map((slot) => (
                              <div key={slot.slotNumber} className="ui-event-card__detail-line">
                                <span>
                                  Slot {slot.slotNumber} · {formatShortDate(slot.date)} · {slot.startTime} -{' '}
                                  {slot.endTime}
                                </span>
                                <span>{Number(slot.judgeCount) || 0}/25</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {hasRubric ? (
                          <div className="ui-event-card__detail-block">
                            {(event.rubric?.criteria || []).map((criterion) => (
                              <div key={criterion.name} className="ui-event-card__detail-line">
                                <span>{criterion.name}</span>
                                <span>{criterion.maxScore} pts</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : null;

                  let expandClosed = 'View details';
                  if (hasSlots && hasRubric) expandClosed = 'View slots & rubric';
                  else if (hasSlots) expandClosed = 'View slots';
                  else if (hasRubric) expandClosed = 'View rubric';

                  const actionsEl = (
                    <>
                      {subtleActions.map((a) => (
                        <Button key={a.label} type="button" variant="ghost" size="sm" onClick={a.onClick}>
                          {a.label}
                        </Button>
                      ))}
                      {secondaryActions.map((a) => (
                        <Button key={a.label} type="button" variant="ghost" size="sm" onClick={a.onClick}>
                          {a.label}
                        </Button>
                      ))}
                    </>
                  );

                  return (
                    <motion.div key={event._id} variants={staggerItem}>
                      <EventCard
                        title={event.title}
                        status={event.status}
                        category={event.category}
                        tags={event.domains || []}
                        maxTags={3}
                        registeredCount={agg.filled}
                        totalSlots={agg.cap > 0 ? agg.cap : undefined}
                        metadataLine={metaSegments.join('  ·  ')}
                        primaryAction={primaryAction}
                        primaryActionLoading={transitionBusyEventId === event._id}
                        primaryActionLoadingLabel={transitionBusyLabel}
                        certificatesIssuedCount={event.certificatesIssuedCount}
                        expandContent={expandContent}
                        expandToggleLabelClosed={expandClosed}
                        actions={actionsEl}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          <aside>
            <Card>
              <h3 className="ds-quick-title">Quick actions</h3>
              <p className="ds-quick-copy ui-muted">
                Spin up a new competition, review signups, or jump into assignments.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="ui-btn--block"
                onClick={() => navigate('/coordinator/events/create')}
              >
                + Create event
              </Button>
            </Card>
          </aside>
        </div>
      </PageShell>

      <ConfirmDialog
        open={transitionDialog.open && !!transitionDialog.nextStatus}
        title={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.title || 'Confirm'}
        message={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.message || ''}
        confirmLabel={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.confirmLabel || 'Confirm'}
        variant={TRANSITION_CONFIRM[transitionDialog.nextStatus]?.variant || 'primary'}
        onConfirm={runTransition}
        onCancel={() => setTransitionDialog({ open: false, eventId: null, nextStatus: null })}
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

      {extendModal.open ? (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={() =>
            !extendModal.saving &&
            setExtendModal({ open: false, eventId: null, date: '', saving: false, extendError: '' })
          }
        >
          <div
            className="confirm-dialog"
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
            <div className="form-group form-group--mb">
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
            {extendModal.extendError ? (
              <div className="alert alert-danger alert-spacing">{extendModal.extendError}</div>
            ) : null}
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
      ) : null}
    </Layout>
  );
};

export default CoordinatorDashboard;
