import Evaluation  from './evaluation.model.js';
import Assignment  from '../assignments/assignment.model.js';
import Event       from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';
import ApiError    from '../../utils/ApiError.js';

// ── Submit evaluation ─────────────────────────────────────────
export const submitEvaluation = async ({ assignmentId, judgeId, scores, remarks }) => {
  // 1. Assignment must exist and belong to this judge
  const assignment = await Assignment.findOne({ _id: assignmentId, judgeId })
    .populate('eventId', 'status rubric');

  if (!assignment) throw new ApiError(404, 'Assignment not found');

  // 2. Event must be in judging status
  if (assignment.eventId.status !== 'judging') {
    throw new ApiError(400, 'Evaluations can only be submitted when the event is in "judging" status');
  }

  // 3. No re-submission — unique index on assignmentId handles DB level,
  //    but we give a cleaner message here
  const existing = await Evaluation.findOne({ assignmentId });
  if (existing) throw new ApiError(409, 'You have already submitted an evaluation for this team');

  // 4. Validate scores match rubric criteria exactly
  const rubricCriteria = assignment.eventId.rubric.criteria;
  if (scores.length !== rubricCriteria.length) {
    throw new ApiError(400, `Expected ${rubricCriteria.length} scores, received ${scores.length}`);
  }

  // 5. Validate each score doesn't exceed maxScore
  for (const s of scores) {
    if (s.score > s.maxScore) {
      throw new ApiError(400, `Score for "${s.criterionName}" (${s.score}) exceeds max (${s.maxScore})`);
    }
  }

  // 6. Calculate total
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  // 7. Save evaluation
  const evaluation = await Evaluation.create({
    assignmentId,
    judgeId,
    registrationId: assignment.registrationId,
    eventId:        assignment.eventId._id,
    scores,
    totalScore,
    remarks,
  });

  return evaluation;
};

// ── Get judge's assignments with evaluation status ────────────
export const getJudgeAssignmentsWithStatus = async ({ judgeId, eventId }) => {
  const assignments = await Assignment.find({ judgeId, eventId })
    .populate({
      path:   'registrationId',
      select: 'teamName domains members githubLink driveLink pptUrl abstractUrl',
    })
    .populate('eventId', 'title status rubric');

  // For each assignment, check if evaluation exists
  const assignmentIds = assignments.map((a) => a._id);
  const evaluations   = await Evaluation.find({
    assignmentId: { $in: assignmentIds },
  }).select('assignmentId totalScore');

  // Map: assignmentId → evaluation
  const evalMap = {};
  for (const e of evaluations) {
    evalMap[e.assignmentId.toString()] = e;
  }

  return assignments.map((a) => ({
    ...a.toObject(),
    evaluation: evalMap[a._id.toString()] || null,
  }));
};

// ── Get evaluation for a specific assignment (judge views own) ─
export const getEvaluationByAssignment = async ({ assignmentId, judgeId }) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, judgeId });
  if (!assignment) throw new ApiError(403, 'Access denied');

  const evaluation = await Evaluation.findOne({ assignmentId });
  if (!evaluation) throw new ApiError(404, 'Evaluation not found');

  return evaluation;
};

// ── Get aggregated results for an event (coordinator view) ────
export const getEventResults = async ({ eventId, coordinatorId }) => {
  // Verify coordinator owns event
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  // Get all evaluations for this event
  const evaluations = await Evaluation.find({ eventId })
    .populate('judgeId',        'name email')
    .populate('registrationId', 'teamName domains members');

  if (evaluations.length === 0) return { event, teams: [] };

  // Group by registrationId and aggregate totals
  const teamMap = {};

  for (const ev of evaluations) {
    const regId = ev.registrationId._id.toString();

    if (!teamMap[regId]) {
      teamMap[regId] = {
        registration:  ev.registrationId,
        evaluations:   [],
        totalScoreSum: 0,
        judgeCount:    0,
      };
    }

    teamMap[regId].evaluations.push({
      judgeId:    ev.judgeId,
      scores:     ev.scores,
      totalScore: ev.totalScore,
      remarks:    ev.remarks,
    });

    teamMap[regId].totalScoreSum += ev.totalScore;
    teamMap[regId].judgeCount    += 1;
  }

  // Build final teams array sorted by average score descending
  const teams = Object.values(teamMap)
    .map((t) => ({
      registration:  t.registration,
      judgeCount:    t.judgeCount,
      totalScoreSum: t.totalScoreSum,
      averageScore:  parseFloat((t.totalScoreSum / t.judgeCount).toFixed(2)),
      evaluations:   t.evaluations,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  return { event, teams };
};
// ── Get participant's own score for their registration ────────
export const getMyScore = async ({ registrationId, teamLeadId }) => {
  // Verify this registration belongs to this participant
  const registration = await Registration.findOne({
    _id:        registrationId,
    teamLeadId,
  });
  if (!registration) throw new ApiError(403, 'Access denied');

  // Get all evaluations for this registration
  const evaluations = await Evaluation.find({ registrationId });

  if (evaluations.length === 0) {
    return {
      evaluated:    false,
      message:      'Your project has not been evaluated yet',
      totalScore:   null,
      averageScore: null,
      judgeCount:   0,
    };
  }

  const judgeCount   = evaluations.length;
  const totalSum     = evaluations.reduce((sum, e) => sum + e.totalScore, 0);
  const averageScore = parseFloat((totalSum / judgeCount).toFixed(2));

  return {
    evaluated:    true,
    judgeCount,
    totalScore:   totalSum,
    averageScore,
  };
};