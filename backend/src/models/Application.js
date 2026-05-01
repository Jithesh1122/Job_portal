import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'rejected'],
      default: 'applied',
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
