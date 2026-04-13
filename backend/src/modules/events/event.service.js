import Event from './event.model.js';
import ApiError from '../../utils/ApiError.js';
import { notifyParticipantsAndJudgesNewEvent } from '../../services/email/mailNotifications.js';
import Certificate from '../certificates/certificate.model.js';
import { issueCertificatesForCompletedEvent } from '../certificates/certificate.service.js';
import { createNewEventNotification } from '../notifications/notification.service.js';
import { validateEventDateRules, validateSlotsForEvent } from '../../utils/eventDatesAndSlots.js';

// Valid status transitions — coordinator cannot skip stages
const VALID_TRANSITIONS = {
  draft:      ['open'],
  open:       ['assigning'],
  assigning:  ['judging'],
  judging:    ['completed'],
  completed:  [],
};

const calendarDay = (d) => new Date(d).toISOString().slice(0, 10);

// ── Create event ──────────────────────────────────────────────
export const createEvent = async (coordinatorId, body) => {
  const event = await Event.create({ ...body, coordinatorId });

  createNewEventNotification(event).catch((err) => {
    console.error('[notifications] create event notification failed:', err?.message || err);
  });

  notifyParticipantsAndJudgesNewEvent(event).catch((err) => {
    console.error('[email] new event broadcast failed (event still created):', err?.message || err);
  });

  return event;
};

// ── Get all events (role-aware) ───────────────────────────────
export const getAllEvents = async (role, userId) => {
  if (role === 'coordinator') {
    const events = await Event.find({ coordinatorId: userId }).sort({ createdAt: -1 }).lean();
    if (events.length === 0) return events;
    const ids = events.map((e) => e._id);
    const counts = await Certificate.aggregate([
      { $match: { eventId: { $in: ids } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    return events.map((e) => ({
      ...e,
      certificatesIssuedCount: countMap[e._id.toString()] || 0,
    }));
  }
  // Participants and judges see all open+ events
  return Event.find({
    status: { $in: ['open', 'assigning', 'judging', 'completed'] },
  }).sort({ createdAt: -1 });
};

// ── Get single event ──────────────────────────────────────────
export const getEventById = async (eventId) => {
  const event = await Event.findById(eventId).populate('coordinatorId', 'name email');
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
};

const DRAFT_UPDATABLE = new Set([
  'title',
  'description',
  'domains',
  'category',
  'slots',
  'rubric',
  'registrationDeadline',
  'eventStartDate',
  'eventEndDate',
]);

function validateRubricWeights(rubric) {
  if (!rubric?.criteria?.length) return;
  for (const c of rubric.criteria) {
    if (c.weight == null) continue;
    const w = Number(c.weight);
    if (Number.isNaN(w) || w < 0 || w > 100) {
      throw new ApiError(400, 'Rubric weight must be between 0 and 100');
    }
  }
}

// ── Update event (coordinator only, draft stage) ──────────────
export const updateEvent = async (eventId, coordinatorId, body) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(404, 'Event not found or access denied');

  if (event.status !== 'draft') {
    throw new ApiError(400, 'Event can only be edited in draft status');
  }

  for (const key of DRAFT_UPDATABLE) {
    if (body[key] !== undefined) event[key] = body[key];
  }

  const start =
    body.eventStartDate !== undefined
      ? String(body.eventStartDate).trim()
      : calendarDay(event.eventStartDate);
  const end =
    body.eventEndDate !== undefined ? String(body.eventEndDate).trim() : calendarDay(event.eventEndDate);
  const reg =
    body.registrationDeadline !== undefined
      ? String(body.registrationDeadline).trim()
      : calendarDay(event.registrationDeadline);

  const dr = validateEventDateRules({
    eventStartDate: start,
    eventEndDate: end,
    registrationDeadline: reg,
  });
  if (!dr.ok) throw new ApiError(400, dr.message);

  const slots =
    body.slots !== undefined
      ? body.slots
      : event.slots.map((s) => ({
          slotNumber: s.slotNumber,
          date: calendarDay(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
        }));
  const sr = validateSlotsForEvent(slots, start, end);
  if (!sr.ok) throw new ApiError(400, sr.message);

  validateRubricWeights(event.rubric);

  await event.save();
  return event;
};

// ── Extend registration deadline (while registrations are open) ─
export const extendRegistrationDeadline = async (eventId, coordinatorId, registrationDeadline) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(404, 'Event not found or access denied');

  if (event.status !== 'open') {
    throw new ApiError(
      400,
      'Registration deadline can only be extended while the event is open for registration'
    );
  }

  const today = calendarDay(new Date());
  const newDay = calendarDay(registrationDeadline);
  if (newDay < today) {
    throw new ApiError(400, 'New deadline must be today or a future date');
  }

  const start = calendarDay(event.eventStartDate);
  const end = calendarDay(event.eventEndDate);
  const dr = validateEventDateRules({
    eventStartDate: start,
    eventEndDate: end,
    registrationDeadline: newDay,
  });
  if (!dr.ok) throw new ApiError(400, dr.message);

  event.registrationDeadline = new Date(registrationDeadline);
  await event.save();
  return event;
};

// ── Transition event status ───────────────────────────────────
export const transitionStatus = async (eventId, coordinatorId, newStatus) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(404, 'Event not found or access denied');

  const allowed = VALID_TRANSITIONS[event.status];
  if (!allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      `Cannot move from "${event.status}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  event.status = newStatus;
  await event.save();

  let certificateIssuance = null;
  if (newStatus === 'completed') {
    try {
      certificateIssuance = await issueCertificatesForCompletedEvent(event);
    } catch (err) {
      console.error('[certificate] issuance fatal:', err?.message || err);
      certificateIssuance = { attempted: 0, issued: 0, skipped: 0, failed: 0, error: String(err?.message || err) };
    }
  }

  return { event, certificateIssuance };
};

// ── Delete event (draft only) ─────────────────────────────────
export const deleteEvent = async (eventId, coordinatorId) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(404, 'Event not found or access denied');

  if (event.status !== 'draft') {
    throw new ApiError(400, 'Only draft events can be deleted');
  }

  await event.deleteOne();
  return { message: 'Event deleted successfully' };
};