import mongoose from 'mongoose';

// ── Subdocument schemas ───────────────────────────────────────

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type:     Number,
    enum:     [1, 2, 3],
    required: true,
  },
  date: {
    type:     Date,
    required: true,
  },
  startTime: {
    type:     String,  // e.g. "10:00 AM"
    required: true,
  },
  // Duration stays a config constant for now — easy to promote to a field later
  judgeCount: {
    type:    Number,
    default: 0,
  },
}, { _id: false });

const criterionSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
  },
  maxScore: {
    type:     Number,
    required: true,
    min:      1,
  },
}, { _id: false });

// ── Main Event schema ─────────────────────────────────────────

const eventSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Event title is required'],
      trim:     true,
    },
    description: {
      type:  String,
      trim:  true,
    },
    coordinatorId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    domains: {
      type:     [String],
      required: [true, 'At least one domain is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message:   'At least one domain is required',
      },
    },
    status: {
      type:    String,
      enum:    ['draft', 'open', 'assigning', 'judging', 'completed'],
      default: 'draft',
    },
    slots: {
      type:     [slotSchema],
      validate: {
        validator: (arr) => arr.length === 3,
        message:   'Exactly 3 judging slots are required',
      },
    },
    rubric: {
      criteria: {
        type:     [criterionSchema],
        validate: {
          validator: (arr) => arr.length > 0,
          message:   'At least one rubric criterion is required',
        },
      },
    },
    registrationDeadline: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;