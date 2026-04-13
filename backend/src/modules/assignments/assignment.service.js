import Assignment    from './assignment.model.js';
import Registration  from '../registrations/registration.model.js';
import JudgeProfile  from '../judges/judge.model.js';
import Event         from '../events/event.model.js';
import ApiError      from '../../utils/ApiError.js';

// ── Assign one team to one judge ──────────────────────────────
export const assignTeam = async ({ eventId, registrationId, judgeId, coordinatorId }) => {
  // 1. Verify coordinator owns this event
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  // 2. Event must be in assigning status
  if (event.status !== 'assigning') {
    throw new ApiError(400, `Assignments can only be made when event is in "assigning" status. Current status: "${event.status}"`);
  }

  // 3. Registration must belong to this event
  const registration = await Registration.findOne({ _id: registrationId, eventId });
  if (!registration) throw new ApiError(404, 'Registration not found for this event');

  // 4. Judge must have signed up for this event
  const judgeProfile = await JudgeProfile.findOne({ judgeId, eventId });
  if (!judgeProfile) throw new ApiError(400, 'This judge has not signed up for this event');

  // 5. Domain match check — at least one domain must overlap
  const teamDomains  = registration.domains;
  const judgeDomains = judgeProfile.domains;
  const hasMatch     = teamDomains.some((d) => judgeDomains.includes(d));
  if (!hasMatch) {
    throw new ApiError(
      400,
      `Domain mismatch. Team domains: [${teamDomains.join(', ')}]. Judge domains: [${judgeDomains.join(', ')}]`
    );
  }

  // 6. Create assignment (unique index prevents duplicate)
  const assignment = await Assignment.create({
    eventId,
    registrationId,
    judgeId,
    assignedBy: coordinatorId,
    roomNo: '',
  });

  return assignment;
};

/** Set the same room label on all assignments for this team (coordinator). */
export const setRoomForRegistration = async ({ eventId, registrationId, roomNo, coordinatorId }) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  if (event.status !== 'assigning') {
    throw new ApiError(400, 'Room can only be set while the event is in assigning status');
  }

  const registration = await Registration.findOne({ _id: registrationId, eventId });
  if (!registration) throw new ApiError(404, 'Registration not found for this event');

  const value = roomNo != null ? String(roomNo).trim() : '';
  await Assignment.updateMany({ eventId, registrationId }, { $set: { roomNo: value } });

  return { message: 'Room updated', roomNo: value };
};

// ── Remove an assignment ──────────────────────────────────────
export const removeAssignment = async ({ assignmentId, coordinatorId }) => {
  const assignment = await Assignment.findById(assignmentId)
    .populate('eventId', 'coordinatorId status');

  if (!assignment) throw new ApiError(404, 'Assignment not found');

  if (assignment.eventId.coordinatorId.toString() !== coordinatorId.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (assignment.eventId.status !== 'assigning') {
    throw new ApiError(400, 'Assignments can only be removed during the assigning phase');
  }

  await assignment.deleteOne();
  return { message: 'Assignment removed successfully' };
};

// ── Get full assignment board for an event (coordinator view) ─
// Returns registrations with their assigned judges,
// and judges with their domain info — everything needed for the UI
export const getAssignmentBoard = async ({ eventId, coordinatorId }) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  // All registrations for this event
  const registrations = await Registration.find({ eventId })
    .populate('teamLeadId', 'name email')
    .sort({ createdAt: 1 });

  // All judge profiles for this event
  const judgeProfiles = await JudgeProfile.find({ eventId })
    .populate('judgeId', 'name email')
    .sort({ slotNumber: 1 });

  // All existing assignments for this event
  const assignments = await Assignment.find({ eventId });

  // Build a map: registrationId → [judgeIds already assigned]
  const assignmentMap = {};
  const roomByRegistration = {};
  for (const a of assignments) {
    const key = a.registrationId.toString();
    if (!assignmentMap[key]) assignmentMap[key] = [];
    assignmentMap[key].push({
      assignmentId: a._id,
      judgeId:      a.judgeId.toString(),
    });
    if (a.roomNo && String(a.roomNo).trim()) {
      roomByRegistration[key] = String(a.roomNo).trim();
    }
  }

  return {
    event,
    registrations,
    judgeProfiles,
    assignmentMap,
    roomByRegistration,
  };
};

// ── Get assignments for a specific judge (judge view) ─────────
export const getMyAssignments = async ({ judgeId, eventId }) => {
  const assignments = await Assignment.find({ judgeId, eventId })
    .populate({
      path:   'registrationId',
      select: 'teamName domains members githubLink driveLink pptUrl abstractUrl',
    });

  return assignments;
};