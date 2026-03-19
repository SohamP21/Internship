import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
    },
    registrationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Registration',
      required: true,
    },
    judgeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    assignedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,  // coordinator's userId
    },
  },
  { timestamps: true }
);

// A team can only be assigned to the same judge once per event
assignmentSchema.index(
  { registrationId: 1, judgeId: 1 },
  { unique: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;