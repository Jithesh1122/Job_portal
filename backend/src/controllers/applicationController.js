import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';

const getSafePublicId = (originalName) => {
  const nameWithoutExtension = originalName.replace(/\.[^/.]+$/, '');
  return nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
};

const uploadBufferToCloudinary = (file) => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary environment variables are not configured');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'mern-job-resumes',
        public_id: `${Date.now()}-${getSafePublicId(file.originalname)}`,
        resource_type: 'raw',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

export const applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!req.file) {
      res.status(400);
      throw new Error('Resume file is required');
    }

    const job = await Job.findById(jobId);

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    const existingApplication = await Application.findOne({
      userId: req.user._id,
      jobId,
    });

    if (existingApplication) {
      res.status(409);
      throw new Error('You have already applied for this job');
    }

    const uploadedResume = await uploadBufferToCloudinary(req.file);

    const application = await Application.create({
      userId: req.user._id,
      jobId,
      resumeUrl: uploadedResume.secure_url,
    });

    const populatedApplication = await application.populate([
      { path: 'jobId', populate: { path: 'recruiterId', select: 'name email role' } },
      { path: 'userId', select: 'name email role' },
    ]);

    res.status(201).json({ application: populatedApplication });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate({
        path: 'jobId',
        populate: { path: 'recruiterId', select: 'name email role' },
      })
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
};
