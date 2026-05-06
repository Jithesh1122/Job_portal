import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      trim: true,
    },
    degree: {
      type: String,
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
    },
    startYear: Number,
    endYear: Number,
  },
  { _id: false },
);

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    startDate: Date,
    endDate: Date,
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    contactDetails: {
      phone: {
        type: String,
        trim: true,
      },
      alternateEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    education: [educationSchema],
    experience: [experienceSchema],
  },
  {
    timestamps: true,
  },
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
