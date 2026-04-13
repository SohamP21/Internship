import Registration from './registration.model.js';
import Event        from '../events/event.model.js';
import Assignment   from '../assignments/assignment.model.js';
import ApiError     from '../../utils/ApiError.js';
import { uploadFile, deleteFile } from '../../config/storage.config.js';
import { isValidGithubUrl, isValidDriveUrl } from '../../utils/linkValidation.js';

// ── Register a team ───────────────────────────────────────────
export const registerTeam = async ({ eventId, teamLeadId, body, files }) => {
  // 1. Event must exist and be open
  const event = await Event.findById(eventId);
  if (!event)                   throw new ApiError(404, 'Event not found');
  if (event.status !== 'open')  throw new ApiError(400, 'Event is not open for registration');

  if (event.registrationDeadline) {
    const today = new Date().toISOString().slice(0, 10);
    const deadlineDay = new Date(event.registrationDeadline).toISOString().slice(0, 10);
    if (today > deadlineDay) {
      throw new ApiError(400, 'Registration deadline has passed. Ask the coordinator to extend it.');
    }
  }

  // 2. One registration per team lead per event (compound index handles DB level,
  //    but we give a cleaner error message here)
  const existing = await Registration.findOne({ teamLeadId, eventId });
  if (existing) throw new ApiError(409, 'You have already registered a team for this event');

  // 3. Domains submitted must be a subset of event domains
  const eventDomains = event.domains;
  const invalid = body.domains.filter((d) => !eventDomains.includes(d));
  if (invalid.length > 0) {
    throw new ApiError(400, `Invalid domains: ${invalid.join(', ')}. Choose from event domains.`);
  }

  if (!isValidGithubUrl(body.githubLink)) {
    throw new ApiError(400, 'Please enter a valid GitHub URL');
  }
  if (!isValidDriveUrl(body.driveLink)) {
    throw new ApiError(400, 'Please enter a valid Google Drive URL');
  }

  // 4. Handle file uploads
  let pptUrl = null, pptFilename = null;
  let abstractUrl = null, abstractFilename = null;

  if (files?.ppt?.[0]) {
    const result  = await uploadFile(files.ppt[0]);
    pptUrl        = result.url;
    pptFilename   = result.filename;
  }
  if (files?.abstract?.[0]) {
    const result      = await uploadFile(files.abstract[0]);
    abstractUrl       = result.url;
    abstractFilename  = result.filename;
  }

  // 5. Create registration
  const registration = await Registration.create({
    eventId,
    teamLeadId,
    teamName:    body.teamName,
    domains:     body.domains,
    members:     body.members,
    githubLink:  body.githubLink  || null,
    driveLink:   body.driveLink   || null,
    pptUrl,
    pptFilename,
    abstractUrl,
    abstractFilename,
  });

  return registration;
};

// ── Get all registrations for an event (coordinator) ──────────
export const getRegistrationsByEvent = async (eventId, coordinatorId) => {
  // Verify this coordinator owns the event
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  return Registration.find({ eventId })
    .populate('teamLeadId', 'name email')
    .sort({ createdAt: -1 });
};

// ── Get registrations for the logged-in participant ───────────
export const getMyRegistrations = async (teamLeadId) => {
  const list = await Registration.find({ teamLeadId })
    .populate('eventId', 'title status domains')
    .sort({ createdAt: -1 })
    .lean();

  if (list.length === 0) return list;

  const ids = list.map((r) => r._id);
  const roomRows = await Assignment.find({ registrationId: { $in: ids } })
    .select('registrationId roomNo')
    .lean();

  const roomByReg = {};
  for (const row of roomRows) {
    const k = row.registrationId.toString();
    const label = (row.roomNo || '').trim();
    if (label) roomByReg[k] = label;
  }

  return list.map((r) => ({
    ...r,
    roomNo: roomByReg[r._id.toString()] || '',
  }));
};

// ── Get single registration ───────────────────────────────────
export const getRegistrationById = async (registrationId, userId, role) => {
  const reg = await Registration.findById(registrationId)
    .populate('eventId',    'title status domains coordinatorId')
    .populate('teamLeadId', 'name email');

  if (!reg) throw new ApiError(404, 'Registration not found');

  // Participant can only see their own
  if (role === 'participant' && reg.teamLeadId._id.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Coordinator can only see registrations for their events
  if (role === 'coordinator' &&
      reg.eventId.coordinatorId.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  return reg;
};