import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    studentName: { type: String, required: true, trim: true },
    eventName: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    rank: { type: String, trim: true },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    pdfPath: { type: String, required: true },
  },
  { timestamps: true }
);

certificateSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
