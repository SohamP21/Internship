import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  name:  {
    type:     String,
    required: [true, 'Member name is required'],
    trim:     true,
  },
  email: {
    type:     String,
    required: [true, 'Member email is required'],
    trim:     true,
    lowercase: true,
  },
  role: {
    type:  String,
    trim:  true,   // e.g. "Frontend Dev", "ML Engineer"
  },
}, { _id: false });

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: true,
    },
    teamLeadId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    teamName: {
      type:     String,
      required: [true, 'Team name is required'],
      trim:     true,
    },
    domains: {
      type:     [String],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message:   'Select at least one domain',
      },
    },
    members: {
      type:     [teamMemberSchema],
      validate: [
        {
          validator: (arr) => arr.length >= 1,
          message:   'Team must have at least 1 member',
        },
        {
          validator: (arr) => arr.length <= 6,
          message:   'Team cannot have more than 6 members',
        },
      ],
    },
    // File deliverables
    pptUrl:       { type: String },
    pptFilename:  { type: String },  // stored for deletion later
    abstractUrl:      { type: String },
    abstractFilename: { type: String },
    githubLink:   { type: String, trim: true },
    driveLink:    { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index — one registration per team lead per event
registrationSchema.index({ teamLeadId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;