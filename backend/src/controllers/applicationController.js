import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import { calculateMatch } from '../utils/skillMatching.js';
import { uploadFileToCloudinary } from '../utils/uploadToCloudinary.js';

const attachProfilesAndMatches = async (applications) => {
  const candidateIds = [
    ...new Set(applications.map((application) => application.userId?._id?.toString()).filter(Boolean)),
  ];
  const profiles = await Profile.find({ user: { $in: candidateIds } });
  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.user.toString(), profile]),
  );

  return applications.map((application) => {
    const profile = profilesByUserId.get(application.userId?._id?.toString());
    const match = calculateMatch(profile?.skills || [], application.jobId?.skills || []);

    return {
      ...application.toObject(),
      candidateProfile: profile
        ? {
            contactDetails: profile.contactDetails || {},
            skills: profile.skills || [],
            education: profile.education || [],
            experience: profile.experience || [],
          }
        : null,
      ...match,
    };
  });
};

const ensureApplicationAccess = (application, user) => {
  if (!application || !application.jobId) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'admin') {
    return;
  }

  if (user.role === 'candidate' && application.userId?._id?.toString() === user._id.toString()) {
    return;
  }

  if (user.role === 'recruiter' && application.jobId.recruiterId?.toString() === user._id.toString()) {
    return;
  }

  const error = new Error('Not authorized to access this resume');
  error.statusCode = 403;
  throw error;
};

const isProfileComplete = (profile) =>
  Boolean(
    profile &&
      profile.skills?.length &&
      profile.education?.length,
  );

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

    if (job.status !== 'approved') {
      res.status(400);
      throw new Error('This job is not accepting applications right now');
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (!isProfileComplete(profile)) {
      res.status(400);
      throw new Error(
        'Complete your profile with skills and education before applying',
      );
    }

    const uploadedResume = await uploadFileToCloudinary(
      req.file,
      'mern-job-resumes',
    );

    const application = await Application.create({
      userId: req.user._id,
      jobId,
      resumeUrl: uploadedResume.secure_url,
      resumePublicId: uploadedResume.public_id,
      resumeFileName: req.file.originalname,
    });

    const populatedApplication = await application.populate([
      { path: 'jobId', populate: { path: 'recruiterId', select: 'name email role' } },
      { path: 'userId', select: 'name email role' },
    ]);

    await Notification.create({
      userId: job.recruiterId,
      title: 'New job application',
      message: `${req.user.name} applied for ${job.title}`,
      type: 'application',
    });

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

export const getRecruiterApplications = async (req, res, next) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'jobId',
        match:
          req.user.role === 'admin'
            ? {}
            : {
                recruiterId: req.user._id,
              },
        populate: { path: 'recruiterId', select: 'name email role' },
      })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      applications: (
        await attachProfilesAndMatches(
          applications.filter((application) => application.jobId),
        )
      ).sort((a, b) => b.matchPercentage - a.matchPercentage),
    });
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (req, res, next) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'jobId',
        populate: { path: 'recruiterId', select: 'name email role' },
      })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ applications: await attachProfilesAndMatches(applications) });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['reviewed', 'shortlisted', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid application status');
    }

    const application = await Application.findById(req.params.id).populate('jobId');

    if (!application || !application.jobId) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (
      req.user.role !== 'admin' &&
      application.jobId.recruiterId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to update this application');
    }

    application.status = status;
    await application.save();

    await Notification.create({
      userId: application.userId,
      title: `Application ${status}`,
      message: `Your application for ${application.jobId.title} was ${status}`,
      type: 'status',
    });

    const populatedApplication = await application.populate([
      { path: 'jobId', populate: { path: 'recruiterId', select: 'name email role' } },
      { path: 'userId', select: 'name email role' },
    ]);

    res.json({ application: populatedApplication });
  } catch (error) {
    next(error);
  }
};

export const sendShortlistedCandidateMessage = async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      res.status(400);
      throw new Error('Message is required');
    }

    const application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('userId', 'name email role');

    if (!application || !application.jobId) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (
      req.user.role !== 'admin' &&
      application.jobId.recruiterId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to message this candidate');
    }

    if (application.status !== 'shortlisted') {
      res.status(400);
      throw new Error('Messages can only be sent to shortlisted candidates');
    }

    await Notification.create({
      userId: application.userId._id,
      title: `Message about ${application.jobId.title}`,
      message,
      type: 'message',
    });

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const downloadApplicationResume = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'jobId',
        select: 'title recruiterId',
      })
      .populate('userId', 'name email role');

    ensureApplicationAccess(application, req.user);

    const response = await fetch(application.resumeUrl);

    if (!response.ok) {
      res.status(502);
      throw new Error('Failed to fetch resume from storage');
    }

    const fileName =
      application.resumeFileName ||
      `${application.userId?.name || 'candidate'}-resume`;
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName.replace(/"/g, '')}"`,
    );
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};
