import Event from './event.model.js';
import Registration from '../registrations/registration.model.js';
import Assignment from '../assignments/assignment.model.js';
import Evaluation from '../evaluations/evaluation.model.js';
import JudgeProfile from '../judges/judge.model.js';
import Certificate from '../certificates/certificate.model.js';
import ApiError from '../../utils/ApiError.js';

const MS_48H = 48 * 60 * 60 * 1000;
const JUDGE_SOFT_CAP = 25;

const pct = (num, den) => (!den || den <= 0 ? 0 : Math.round((100 * num) / den));

const domainHistogram = (registrations) => {
  const map = {};
  for (const r of registrations) {
    for (const d of r.domains || []) {
      map[d] = (map[d] || 0) + 1;
    }
  }
  return Object.entries(map)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

const judgeWorkload = (assignments, judgeProfiles, totalAssignments) => {
  const byJudge = {};
  for (const a of assignments) {
    const id = a.judgeId.toString();
    byJudge[id] = (byJudge[id] || 0) + 1;
  }
  const values = Object.values(byJudge);
  const avg = values.length ? values.reduce((s, n) => s + n, 0) / values.length : 0;

  return judgeProfiles.map((jp) => {
    const jid = jp.judgeId._id?.toString?.() || jp.judgeId.toString();
    const name = jp.judgeId?.name || 'Judge';
    const c = byJudge[jid] || 0;
    const loadRatio = JUDGE_SOFT_CAP > 0 ? c / JUDGE_SOFT_CAP : 0;
    let status = 'balanced';
    if (totalAssignments > 4 && avg > 0) {
      if (c >= Math.max(avg * 1.5, 12)) status = 'overloaded';
      else if (c <= Math.min(avg * 0.5, 3)) status = 'underutilized';
    } else if (c >= 18) status = 'overloaded';
    else if (c <= 1 && totalAssignments > 6) status = 'underutilized';

    return {
      judgeId: jid,
      name,
      assignments: c,
      capacity: JUDGE_SOFT_CAP,
      loadRatio: Math.round(loadRatio * 100) / 100,
      status,
    };
  });
};

async function buildEventPayload(event) {
  const eventId = event._id;
  const registrations = await Registration.find({ eventId }).select(
    '_id domains pptUrl abstractUrl githubLink driveLink'
  );
  const assignments = await Assignment.find({ eventId });
  const evaluations = await Evaluation.find({ eventId });
  const judgeProfiles = await JudgeProfile.find({ eventId }).populate('judgeId', 'name email');

  const regIds = registrations.map((r) => r._id.toString());
  const assignedReg = new Set(assignments.map((a) => a.registrationId.toString()));
  const teamsWithAssignment = regIds.filter((id) => assignedReg.has(id)).length;
  const totalRegs = registrations.length;
  const teamsUnassigned = Math.max(0, totalRegs - teamsWithAssignment);

  const totalAssignments = assignments.length;
  const totalEvaluationsSubmitted = evaluations.length;
  const pendingEvaluations = Math.max(0, totalAssignments - totalEvaluationsSubmitted);

  const assignmentCoveragePct = pct(teamsWithAssignment, totalRegs);
  const evaluationCoveragePct = pct(totalEvaluationsSubmitted, totalAssignments);

  const now = Date.now();
  let dueSoon = false;
  if (event.status === 'open' && event.registrationDeadline) {
    const end = new Date(event.registrationDeadline).getTime();
    if (end > now && end - now <= MS_48H) dueSoon = true;
  }

  let withPpt = 0;
  let withAbstract = 0;
  let withLinks = 0;
  let submissionComplete = 0;
  for (const r of registrations) {
    const ppt = !!(r.pptUrl && String(r.pptUrl).trim());
    const abs = !!(r.abstractUrl && String(r.abstractUrl).trim());
    const links = !!(
      (r.githubLink && String(r.githubLink).trim()) ||
      (r.driveLink && String(r.driveLink).trim())
    );
    if (ppt) withPpt += 1;
    if (abs) withAbstract += 1;
    if (links) withLinks += 1;
    if (ppt && abs && links) submissionComplete += 1;
  }

  return {
    event: {
      _id: event._id,
      title: event.title,
      status: event.status,
      registrationDeadline: event.registrationDeadline,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
    },
    counts: {
      totalRegistrations: totalRegs,
      totalAssigned: totalAssignments,
      totalEvaluationsSubmitted,
      pendingEvaluations,
      teamsUnassigned,
      dueSoon48h: dueSoon ? 1 : 0,
    },
    percentages: {
      assignmentCoverage: assignmentCoveragePct,
      evaluationCoverage: evaluationCoveragePct,
      assignedTeams: teamsWithAssignment,
    },
    judges: judgeWorkload(assignments, judgeProfiles, totalAssignments),
    topDomains: domainHistogram(registrations),
    submissionReadiness: {
      withPpt,
      withAbstract,
      withLinks,
      complete: submissionComplete,
    },
  };
}

export const getOpsSummary = async ({ user, eventId: rawEventId }) => {
  const { role, _id: userId } = user;
  const eventId = rawEventId && String(rawEventId).trim();

  if (role === 'coordinator') {
    if (eventId) {
      const event = await Event.findOne({ _id: eventId, coordinatorId: userId });
      if (!event) throw new ApiError(403, 'Event not found or access denied');
      const detail = await buildEventPayload(event);
      return { scope: 'event', ...detail };
    }

    const events = await Event.find({ coordinatorId: userId }).sort({ createdAt: -1 });
    let totalRegistrations = 0;
    let totalAssigned = 0;
    let totalEvaluationsSubmitted = 0;
    let pendingEvaluations = 0;
    let openRegistrationsEvents = 0;
    let assigningEvents = 0;
    let judgingEvents = 0;
    let completedEvents = 0;
    let dueSoon48h = 0;
    const perEvent = [];
    const now = Date.now();

    for (const ev of events) {
      if (ev.status === 'open') openRegistrationsEvents += 1;
      if (ev.status === 'assigning') assigningEvents += 1;
      if (ev.status === 'judging') judgingEvents += 1;
      if (ev.status === 'completed') completedEvents += 1;

      if (ev.status === 'open' && ev.registrationDeadline) {
        const end = new Date(ev.registrationDeadline).getTime();
        if (end > now && end - now <= MS_48H) dueSoon48h += 1;
      }

      const eid = ev._id;
      const [regN, assignN, evalN] = await Promise.all([
        Registration.countDocuments({ eventId: eid }),
        Assignment.countDocuments({ eventId: eid }),
        Evaluation.countDocuments({ eventId: eid }),
      ]);
      const regs = await Registration.find({ eventId: eid }).select('_id');
      const regIdStrs = new Set(regs.map((r) => r._id.toString()));
      const assignedRegs = await Assignment.distinct('registrationId', { eventId: eid });
      const teamsWithAssignment = assignedRegs.filter((id) => regIdStrs.has(id.toString())).length;

      totalRegistrations += regN;
      totalAssigned += assignN;
      totalEvaluationsSubmitted += evalN;
      pendingEvaluations += Math.max(0, assignN - evalN);

      perEvent.push({
        _id: ev._id,
        title: ev.title,
        status: ev.status,
        registrationDeadline: ev.registrationDeadline,
        registrations: regN,
        assignments: assignN,
        evaluations: evalN,
        pendingEvaluations: Math.max(0, assignN - evalN),
        assignmentCoverage: pct(teamsWithAssignment, regN),
        evaluationCoverage: pct(evalN, assignN),
        teamsUnassigned: Math.max(0, regN - teamsWithAssignment),
      });
    }

    const eventIds = events.map((e) => e._id);
    const allRegs =
      eventIds.length > 0
        ? await Registration.find({ eventId: { $in: eventIds } }).select('domains')
        : [];
    const topDomainsAll = domainHistogram(allRegs);

    return {
      scope: 'all',
      counts: {
        totalRegistrations,
        totalAssigned,
        totalEvaluationsSubmitted,
        pendingEvaluations,
        openRegistrationsEvents,
        assigningEvents,
        judgingEvents,
        completedEvents,
        dueSoon48h,
        myEvents: events.length,
      },
      percentages: {
        assignmentCoverage: pct(
          perEvent.reduce((s, p) => s + (p.registrations - p.teamsUnassigned), 0),
          totalRegistrations
        ),
        evaluationCoverage: pct(totalEvaluationsSubmitted, totalAssigned),
      },
      perEvent,
      topDomains: topDomainsAll,
      events: events.map((e) => ({ _id: e._id, title: e.title, status: e.status })),
    };
  }

  if (role === 'judge') {
    const profiles = await JudgeProfile.find({ judgeId: userId }).populate('eventId');
    const eventDocs = profiles.map((p) => p.eventId).filter((e) => e && e._id);

    if (eventId) {
      const allowed = profiles.some((p) => p.eventId._id.toString() === eventId);
      if (!allowed) throw new ApiError(403, 'You are not assigned to this event');
      const event = await Event.findById(eventId);
      if (!event) throw new ApiError(404, 'Event not found');
      const detail = await buildEventPayload(event);
      const myAssign = await Assignment.countDocuments({ eventId, judgeId: userId });
      const myEval = await Evaluation.countDocuments({ eventId, judgeId: userId });
      const myPending = Math.max(0, myAssign - myEval);
      return {
        scope: 'event',
        ...detail,
        myJudge: { assignments: myAssign, evaluationsSubmitted: myEval, pendingEvaluations: myPending },
      };
    }

    let totalAssignments = 0;
    let totalEvaluationsSubmitted = 0;
    let pendingEvaluations = 0;
    const perEvent = [];

    for (const ev of eventDocs) {
      const eid = ev._id;
      const assignN = await Assignment.countDocuments({ eventId: eid, judgeId: userId });
      const evalN = await Evaluation.countDocuments({ eventId: eid, judgeId: userId });
      const pend = Math.max(0, assignN - evalN);
      totalAssignments += assignN;
      totalEvaluationsSubmitted += evalN;
      pendingEvaluations += pend;
      perEvent.push({
        _id: ev._id,
        title: ev.title,
        status: ev.status,
        assignments: assignN,
        evaluations: evalN,
        pendingEvaluations: pend,
      });
    }

    return {
      scope: 'all',
      counts: {
        myEvents: eventDocs.length,
        totalAssignments,
        totalEvaluationsSubmitted,
        pendingEvaluations,
      },
      percentages: {
        evaluationCoverage: pct(totalEvaluationsSubmitted, totalAssignments),
      },
      perEvent,
      events: eventDocs.map((e) => ({ _id: e._id, title: e.title, status: e.status })),
    };
  }

  if (role === 'participant') {
    const regs = await Registration.find({ teamLeadId: userId }).populate(
      'eventId',
      'title status registrationDeadline eventStartDate eventEndDate'
    );

    let activeTeams = 0;
    let evaluatedTeams = 0;
    let pendingScores = 0;
    const deadlines = [];
    let withPpt = 0;
    let withAbstract = 0;
    let withLinks = 0;

    const regIds = regs.map((r) => r._id);
    const [evalAgg, assignAgg] =
      regIds.length > 0
        ? await Promise.all([
            Evaluation.aggregate([
              { $match: { registrationId: { $in: regIds } } },
              { $group: { _id: '$registrationId', n: { $sum: 1 } } },
            ]),
            Assignment.aggregate([
              { $match: { registrationId: { $in: regIds } } },
              { $group: { _id: '$registrationId', n: { $sum: 1 } } },
            ]),
          ])
        : [[], []];

    const evalMap = Object.fromEntries(evalAgg.map((x) => [String(x._id), x.n]));
    const assignMap = Object.fromEntries(assignAgg.map((x) => [String(x._id), x.n]));

    for (const r of regs) {
      const ev = r.eventId;
      if (!ev) continue;
      if (['open', 'assigning', 'judging'].includes(ev.status)) activeTeams += 1;

      const ppt = !!(r.pptUrl && String(r.pptUrl).trim());
      const abs = !!(r.abstractUrl && String(r.abstractUrl).trim());
      const links = !!(
        (r.githubLink && String(r.githubLink).trim()) ||
        (r.driveLink && String(r.driveLink).trim())
      );
      if (ppt) withPpt += 1;
      if (abs) withAbstract += 1;
      if (links) withLinks += 1;

      const rid = r._id.toString();
      const evalCount = evalMap[rid] || 0;
      const assignCount = assignMap[rid] || 0;
      if (assignCount > 0 && evalCount >= assignCount) evaluatedTeams += 1;
      else if (assignCount > 0) pendingScores += 1;

      if (ev.registrationDeadline && ev.status === 'open') {
        deadlines.push({
          eventId: ev._id,
          title: ev.title,
          date: ev.registrationDeadline,
          type: 'registration',
        });
      }
    }

    deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

    const certificatesEarned = await Certificate.countDocuments({ studentId: userId });

    return {
      scope: 'participant',
      counts: {
        myRegistrations: regs.length,
        activeTeams,
        evaluatedTeams,
        pendingScores,
        submissionsWithPpt: withPpt,
        submissionsWithAbstract: withAbstract,
        submissionsWithLinks: withLinks,
        certificatesEarned,
      },
      deadlines: deadlines.slice(0, 12),
    };
  }

  throw new ApiError(403, 'Unsupported role for operations summary');
};
