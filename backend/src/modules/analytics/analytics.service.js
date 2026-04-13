import mongoose from 'mongoose';
import Event from '../events/event.model.js';
import Registration from '../registrations/registration.model.js';

/**
 * Aggregated analytics for a coordinator's events.
 */
export async function getCoordinatorOverview(coordinatorId) {
  const events = await Event.find({ coordinatorId })
    .select('title status category')
    .lean();

  const eventIds = events.map((e) => e._id);
  const totalEvents = events.length;

  if (eventIds.length === 0) {
    return {
      barByEvent: [],
      categoryPie: [],
      registrationsOverTime: [],
      stats: {
        totalEvents: 0,
        totalRegistrations: 0,
        avgRegistrationsPerEvent: 0,
        mostPopularEventName: null,
        mostPopularEventCount: 0,
      },
    };
  }

  const oidList = eventIds.map((id) => new mongoose.Types.ObjectId(id));

  const regPerEvent = await Registration.aggregate([
    { $match: { eventId: { $in: oidList } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(regPerEvent.map((r) => [r._id.toString(), r.count]));

  const totalRegistrations = regPerEvent.reduce((s, r) => s + r.count, 0);
  const avgRegistrationsPerEvent = totalEvents ? totalRegistrations / totalEvents : 0;

  let mostPopularEventName = null;
  let mostPopularEventCount = 0;
  const barByEvent = events.map((e) => {
    const c = countMap[e._id.toString()] || 0;
    if (c > mostPopularEventCount) {
      mostPopularEventCount = c;
      mostPopularEventName = e.title;
    }
    return {
      eventId: e._id,
      name: e.title,
      registrations: c,
      status: e.status,
    };
  });

  const categoryBuckets = {};
  for (const e of events) {
    const cat = e.category && String(e.category).trim() ? e.category : 'General';
    categoryBuckets[cat] = (categoryBuckets[cat] || 0) + 1;
  }
  const categoryPie = Object.entries(categoryBuckets).map(([name, value]) => ({ name, value }));

  const daily = await Registration.aggregate([
    { $match: { eventId: { $in: oidList } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  let cumulative = 0;
  const registrationsOverTime = daily.map((d) => {
    cumulative += d.count;
    return { date: d._id, count: d.count, cumulative };
  });

  return {
    barByEvent,
    categoryPie,
    registrationsOverTime,
    stats: {
      totalEvents,
      totalRegistrations,
      avgRegistrationsPerEvent: Math.round(avgRegistrationsPerEvent * 100) / 100,
      mostPopularEventName,
      mostPopularEventCount,
    },
  };
}
