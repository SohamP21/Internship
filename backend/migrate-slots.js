/**
 * One-time migration: adds endTime to old slots that don't have it.
 * Sets endTime to 3 hours after startTime (matching the old "3 hrs" default).
 *
 * Run:  node migrate-slots.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

function addHours(timeStr, hours) {
  // timeStr is like "10:00" or "14:30"
  const [h, m] = timeStr.split(':').map(Number);
  const newH = (h + hours) % 24;
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const events = db.collection('events');

  // Find events that have slots without endTime
  const cursor = events.find({ 'slots.endTime': { $exists: false } });
  let updated = 0;

  for await (const doc of cursor) {
    const newSlots = doc.slots.map((s) => ({
      ...s,
      endTime: s.endTime || addHours(s.startTime || '10:00', 3),
    }));

    await events.updateOne(
      { _id: doc._id },
      { $set: { slots: newSlots } }
    );
    updated++;
    console.log(`  Updated event: ${doc.title}`);
  }

  console.log(`\nDone! Updated ${updated} event(s).`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
