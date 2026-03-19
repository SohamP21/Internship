import Event from './event.model.js';
import ApiError from '../../utils/ApiError.js';

// Valid status transitions — coordinator cannot skip stages
const VALID_TRANSITIONS = {
  draft:      ['open'],
  open:       ['assigning'],
  assigning:  ['judging'],
  judging:    ['completed'],
  completed:  [],
};

// ── Create event ──────────────────────────────────────────────
export const createEvent = async (coordinatorId, body) => {
  const event = await Event.create({ ...body, coordinatorId });
  return event;
};

// ── Get all events (role-aware) ───────────────────────────────
export const getAllEvents = async (role, userId) => {
  if (role === 'coordinator') {
    // Coordinator sees only their own events
    return Event.find({ coordinatorId: userId }).sort({ createdAt: -1 });
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

// ── Update event (coordinator only, draft stage) ──────────────
export const updateEvent = async (eventId, coordinatorId, body) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(404, 'Event not found or access denied');

  if (event.status !== 'draft') {
    throw new ApiError(400, 'Event can only be edited in draft status');
  }

  Object.assign(event, body);
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
  return event;
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