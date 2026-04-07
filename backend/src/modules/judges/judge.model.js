import mongoose from 'mongoose';

const SLOT_CAPACITY = 25; // single source of truth

const judgeProfileSchema = new mongoose.Schema(
  {
    judgeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
    },
    domains: {
      type:     [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message:   'Select at least one domain',
      },
    },
    slotNumber: {
      type:     Number,
      required: true,
      min:      1,
    },
  },
  { timestamps: true }
);

// One judge profile per judge per event
judgeProfileSchema.index({ judgeId: 1, eventId: 1 }, { unique: true });

judgeProfileSchema.statics.SLOT_CAPACITY = SLOT_CAPACITY;

const JudgeProfile = mongoose.model('JudgeProfile', judgeProfileSchema);
export default JudgeProfile;