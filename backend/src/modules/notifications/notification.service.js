import Notification from './notification.model.js';

export async function createNewEventNotification(eventDoc) {
  const title = String(eventDoc.title || 'Event').trim();
  const message = `New event published: ${title}`;
  return Notification.create({
    message,
    eventId: eventDoc._id,
    readBy: [],
  });
}

export async function getRecentForUser(userId, limit = 10) {
  const list = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('eventId', 'title status')
    .lean();

  const uid = userId.toString();
  return list.map((n) => ({
    _id: n._id,
    message: n.message,
    eventId: n.eventId?._id,
    eventTitle: n.eventId?.title,
    eventStatus: n.eventId?.status,
    createdAt: n.createdAt,
    read: (n.readBy || []).some((id) => id.toString() === uid),
  }));
}

export async function countUnread(userId) {
  return Notification.countDocuments({
    readBy: { $nin: [userId] },
  });
}

export async function markRead(notificationId, userId) {
  await Notification.updateOne(
    { _id: notificationId },
    { $addToSet: { readBy: userId } }
  );
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    { readBy: { $nin: [userId] } },
    { $addToSet: { readBy: userId } }
  );
}
