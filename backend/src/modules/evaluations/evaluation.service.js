import mongoose from 'mongoose';
import Evaluation  from './evaluation.model.js';
import Assignment  from '../assignments/assignment.model.js';
import Event       from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';
import ApiError    from '../../utils/ApiError.js';
import {
  olympicTrimmedMean,
  normalizeRubricWeights,
  weightedOverallFromRubrics,
} from '../../utils/olympicScoring.js';

const METHODOLOGY = 'olympic_trimmed_mean_per_rubric_weighted_0_100';

function buildRubricProcessedRows(event, evaluationsForTeam) {
  const criteria = normalizeRubricWeights(event.rubric.criteria);
  return criteria.map((crit) => {
    const rawScoresByJudge = [];
    for (const ev of evaluationsForTeam) {
      const sc = ev.scores.find((s) => s.criterionName === crit.name);
      if (sc != null) {
        rawScoresByJudge.push({
          judgeId:   ev.judgeId?._id || ev.judgeId,
          judgeName: ev.judgeId?.name,
          score:     sc.score,
          maxScore:  sc.maxScore,
        });
      }
    }
    const values = rawScoresByJudge.map((r) => r.score);
    const o = olympicTrimmedMean(values);
    return {
      criterionName: crit.name,
      maxScore:      crit.maxScore,
      weight:        crit.weight,
      weightPercent: parseFloat((crit.weight * 100).toFixed(2)),
      weightSource:  crit.weightSource,
      rawScoresByJudge,
      processed:     {
        trimmedMean:   o.trimmedMean,
        usedScores:    o.usedScores,
        droppedLow:    o.droppedLow,
        droppedHigh:   o.droppedHigh,
        judgeCount:    o.judgeCount,
        trimRule:      o.trimRule,
      },
      normalizedFraction:
        o.trimmedMean != null && crit.maxScore
          ? parseFloat((o.trimmedMean / crit.maxScore).toFixed(4))
          : null,
    };
  });
}

function computeTeamScoring(event, evaluationsForTeam, expectedAssignmentCount) {
  const submitted = evaluationsForTeam.length;
  const scoringComplete =
    expectedAssignmentCount > 0 && submitted >= expectedAssignmentCount;

  const rubricBreakdown = buildRubricProcessedRows(event, evaluationsForTeam);

  let processedScoring = null;
  if (scoringComplete && submitted > 0) {
    const forOverall = rubricBreakdown.map((r) => ({
      trimmedMean: r.processed.trimmedMean,
      maxScore:    r.maxScore,
      weight:      r.weight,
    }));
    const overallScore = weightedOverallFromRubrics(forOverall);
    processedScoring = {
      methodology: METHODOLOGY,
      overallScore,
      rubricBreakdown,
      computedAt: new Date().toISOString(),
    };
  }

  const totalScoreSum = evaluationsForTeam.reduce((s, e) => s + e.totalScore, 0);
  const simpleAverageRawTotal =
    submitted > 0 ? parseFloat((totalScoreSum / submitted).toFixed(2)) : null;

  return {
    judgeCount: submitted,
    expectedJudgeCount: expectedAssignmentCount,
    scoringComplete,
    totalScoreSum,
    /** Simple mean of judges' raw total points (legacy / transparency). */
    averageRawTotalScore: simpleAverageRawTotal,
    /** Official 0–100 score when all judges submitted; otherwise null. */
    averageScore: processedScoring?.overallScore ?? null,
    processedScoring,
    rubricBreakdownPreview: scoringComplete ? null : rubricBreakdown,
  };
}

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

const SCORING_META_NOTE =
  'Per rubric: sort judge scores, drop extremes (1+1 if 3–4 judges, 2+2 if ≥5), average the rest. Overall = Σ(weight × trimmedMean/maxScore) × 100. Shown when every assigned judge has submitted.';

/**
 * Build sorted team leaderboard for an event from evaluations (same ordering as coordinator results).
 * @param {import('mongoose').Document} event — Event document with rubric loaded
 */
async function aggregateTeamsByEvaluations(event) {
  const evaluations = await Evaluation.find({ eventId: event._id })
    .populate('judgeId', 'name email')
    .populate('registrationId', 'teamName domains members');

  if (evaluations.length === 0) {
    return {
      teams: [],
      scoringMeta: {
        methodology: METHODOLOGY,
        note: 'Olympic averaging per rubric; weighted overall 0–100 when all assigned judges submit.',
      },
    };
  }

  const teamMap = {};
  for (const ev of evaluations) {
    const regId = ev.registrationId._id.toString();
    if (!teamMap[regId]) {
      teamMap[regId] = {
        registration: ev.registrationId,
        evaluations: [],
      };
    }
    teamMap[regId].evaluations.push({
      judgeId: ev.judgeId,
      scores: ev.scores,
      totalScore: ev.totalScore,
      remarks: ev.remarks,
    });
  }

  const regIds = Object.keys(teamMap);
  const regObjectIds = regIds.map((id) => new mongoose.Types.ObjectId(id));
  const assignmentCounts = await Assignment.aggregate([
    { $match: { eventId: event._id, registrationId: { $in: regObjectIds } } },
    { $group: { _id: '$registrationId', count: { $sum: 1 } } },
  ]);
  const countByReg = Object.fromEntries(assignmentCounts.map((x) => [x._id.toString(), x.count]));

  const teams = await Promise.all(
    Object.values(teamMap).map(async (t) => {
      const regId = t.registration._id.toString();
      const expected = countByReg[regId] ?? 0;
      const scoring = computeTeamScoring(event, t.evaluations, expected);

      return {
        registration: t.registration,
        evaluations: t.evaluations,
        judgeCount: scoring.judgeCount,
        expectedJudgeCount: scoring.expectedJudgeCount,
        scoringComplete: scoring.scoringComplete,
        totalScoreSum: scoring.totalScoreSum,
        averageRawTotalScore: scoring.averageRawTotalScore,
        averageScore: scoring.averageScore,
        processedScoring: scoring.processedScoring,
        rubricBreakdownPreview: scoring.rubricBreakdownPreview,
      };
    })
  );

  teams.sort((a, b) => {
    const ao = a.processedScoring?.overallScore;
    const bo = b.processedScoring?.overallScore;
    if (ao != null && bo != null) return bo - ao;
    if (ao != null) return -1;
    if (bo != null) return 1;
    return (b.averageRawTotalScore ?? 0) - (a.averageRawTotalScore ?? 0);
  });

  return {
    teams,
    scoringMeta: {
      methodology: METHODOLOGY,
      note: SCORING_META_NOTE,
    },
  };
}

function placeLabel(position) {
  if (position === 1) return '1st Place';
  if (position === 2) return '2nd Place';
  if (position === 3) return '3rd Place';
  const v = position % 100;
  if (v >= 11 && v <= 13) return `${position}th Place`;
  switch (position % 10) {
    case 1:
      return `${position}st Place`;
    case 2:
      return `${position}nd Place`;
    case 3:
      return `${position}rd Place`;
    default:
      return `${position}th Place`;
  }
}

/** registrationId (string) → rank label; registrations with no evaluations are omitted. */
export async function buildRegistrationRankMapForEvent(eventId) {
  const event = await Event.findById(eventId);
  const map = new Map();
  if (!event) return map;

  const { teams } = await aggregateTeamsByEvaluations(event);
  teams.forEach((team, idx) => {
    map.set(team.registration._id.toString(), placeLabel(idx + 1));
  });
  return map;
}

// ── Get aggregated results for an event (coordinator view) ────
export const getEventResults = async ({ eventId, coordinatorId }) => {
  const event = await Event.findOne({ _id: eventId, coordinatorId });
  if (!event) throw new ApiError(403, 'Access denied');

  const { teams, scoringMeta } = await aggregateTeamsByEvaluations(event);
  return {
    event,
    teams,
    scoringMeta,
  };
};
// ── Get participant's own score for their registration ────────
export const getMyScore = async ({ registrationId, teamLeadId }) => {
  const registration = await Registration.findOne({
    _id:        registrationId,
    teamLeadId,
  });
  if (!registration) throw new ApiError(403, 'Access denied');

  const evaluations = await Evaluation.find({ registrationId }).populate('judgeId', 'name email');

  if (evaluations.length === 0) {
    return {
      evaluated:    false,
      message:      'Your project has not been evaluated yet',
      totalScore:   null,
      averageScore: null,
      judgeCount:   0,
      expectedJudgeCount: 0,
      scoringComplete: false,
      processedScoring: null,
    };
  }

  const event = await Event.findById(registration.eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const expected = await Assignment.countDocuments({
    eventId:         registration.eventId,
    registrationId: registration._id,
  });

  const evPayload = evaluations.map((ev) => ({
    judgeId:    ev.judgeId,
    scores:     ev.scores,
    totalScore: ev.totalScore,
    remarks:    ev.remarks,
  }));

  const scoring = computeTeamScoring(event, evPayload, expected);
  const totalSum = scoring.totalScoreSum;

  return {
    evaluated:            true,
    judgeCount:           scoring.judgeCount,
    expectedJudgeCount:   scoring.expectedJudgeCount,
    scoringComplete:      scoring.scoringComplete,
    totalScore:           totalSum,
    averageRawTotalScore: scoring.averageRawTotalScore,
    averageScore:         scoring.averageScore,
    processedScoring:     scoring.processedScoring,
    rubricBreakdownPreview: scoring.rubricBreakdownPreview,
    methodology:          METHODOLOGY,
  };
};