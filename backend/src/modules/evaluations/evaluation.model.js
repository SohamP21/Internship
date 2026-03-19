import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  criterionName: {
    type:     String,
    required: true,
  },
  maxScore: {
    type:     Number,
    required: true,
  },
  score: {
    type:     Number,
    required: true,
    min:      0,
  },
}, { _id: false });

const evaluationSchema = new mongoose.Schema(
  {
    assignmentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Assignment',
      required: true,
      unique:   true, // one evaluation per assignment — enforces no re-submission
    },
    judgeId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    registrationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Registration',
      required: true,
    },
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
    },
    scores: {
      type:     [scoreSchema],
      required: true,
    },
    totalScore: {
      type:     Number,
      required: true,
    },
    remarks: {
      type:  String,
      trim:  true,
    },
  },
  { timestamps: true }
);

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;