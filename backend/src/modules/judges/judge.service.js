import JudgeProfile from './judge.model.js';
import Event        from '../events/event.model.js';
import ApiError     from '../../utils/ApiError.js';

// ── Judge signs up for an event ───────────────────────────────
export const onboardJudge = async ({ judgeId, eventId, domains, slotNumber }) => {
  // 1. Event must exist and be open
  const event = await Event.findById(eventId);
  if (!event)                  throw new ApiError(404, 'Event not found');
  if (event.status !== 'open') throw new ApiError(400, 'Event is not open for judge sign-ups');

  // 2. One profile per judge per event
  const existing = await JudgeProfile.findOne({ judgeId, eventId });
  if (existing) throw new ApiError(409, 'You have already signed up to judge this event');

  // 3. Domains must be a subset of event domains
  const invalid = domains.filter((d) => !event.domains.includes(d));
  if (invalid.length > 0) {
    throw new ApiError(400, `Invalid domains: ${invalid.join(', ')}`);
  }

  // 4. Check slot capacity — max 25 judges per slot
  const slotCount = await JudgeProfile.countDocuments({ eventId, slotNumber });
  if (slotCount >= JudgeProfile.SLOT_CAPACITY) {
    throw new ApiError(409, `Slot ${slotNumber} is full (max ${JudgeProfile.SLOT_CAPACITY} judges). Please choose another slot.`);
  }

  // 5. Increment judgeCount on the slot inside the Event document
  await Event.updateOne(
    { _id: eventId, 'slots.slotNumber': slotNumber },
    { $inc: { 'slots.$.judgeCount': 1 } }
  );

  // 6. Create judge profile
  const profile = await JudgeProfile.create({ judgeId, eventId, domains, slotNumber });
  return profile;
};

// ── Get judge's own profiles (which events they signed up for) ─
export const getMyProfiles = async (judgeId) => {
  const profiles = await JudgeProfile.find({ judgeId })
    .populate({
      path:   'eventId',
      select: 'title status domains slots',
    })
    .sort({ createdAt: -1 });
  return profiles;
};

// ── Get all judge profiles for an event (coordinator use) ─────
export const getJudgesByEvent = async (eventId, coordinatorId) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  return JudgeProfile.find({ eventId })
    .populate('judgeId', 'name email')
    .sort({ slotNumber: 1, createdAt: 1 });
};

// ── Check if a judge has signed up for a specific event ────────
export const getMyProfileForEvent = async (judgeId, eventId) => {
  return JudgeProfile.findOne({ judgeId, eventId })
    .populate('eventId', 'title status domains slots');
};