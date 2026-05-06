import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { calculateMatch } from '../utils/skillMatching.js';
import { normalizeString } from '../utils/validation.js';

const normalizeJobPayload = (payload) => ({
  title: normalizeString(payload.title),
  description: normalizeString(payload.description),
  skills: Array.isArray(payload.skills)
    ? payload.skills.map((skill) => skill.trim()).filter(Boolean)
    : [],
  salary: payload.salary === '' || payload.salary === undefined ? undefined : Number(payload.salary),
  location: normalizeString(payload.location),
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildJobQuery = (queryParams) => {
  const { keyword, location, minSalary, maxSalary, skills } = queryParams;
  const query = {};

  if (keyword) {
    const keywordRegex = new RegExp(escapeRegex(keyword), 'i');
    query.$or = [
      { title: keywordRegex },
      { description: keywordRegex },
      { skills: keywordRegex },
    ];
  }

  if (location) {
    query.location = new RegExp(escapeRegex(location), 'i');
  }

  if (skills) {
    const skillList = skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (skillList.length > 0) {
      query.skills = {
        $all: skillList.map((skill) => new RegExp(`^${escapeRegex(skill)}$`, 'i')),
      };
    }
  }

  const minimumSalary = Number(minSalary);
  const maximumSalary = Number(maxSalary);

  if (!Number.isNaN(minimumSalary) || !Number.isNaN(maximumSalary)) {
    query.salary = {};

    if (!Number.isNaN(minimumSalary)) {
      query.salary.$gte = minimumSalary;
    }

    if (!Number.isNaN(maximumSalary)) {
      query.salary.$lte = maximumSalary;
    }
  }

  return query;
};

const getApprovedRecruiterIds = async () => {
  const approvedRecruiters = await User.find({
    role: 'recruiter',
    isApproved: true,
  }).select('_id');

  return approvedRecruiters.map((recruiter) => recruiter._id);
};

const buildVisibilityQuery = async (user) => {
  if (!user) {
    return { recruiterId: { $in: await getApprovedRecruiterIds() } };
  }

  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'recruiter') {
    return {
      $or: [{ recruiterId: { $in: await getApprovedRecruiterIds() } }, { recruiterId: user._id }],
    };
  }

  return { recruiterId: { $in: await getApprovedRecruiterIds() } };
};

const ensureJobOwnerOrAdmin = (job, user) => {
  if (user.role === 'admin') {
    return;
  }

  if (job.recruiterId.toString() !== user._id.toString()) {
    const error = new Error('Not authorized to manage this job');
    error.statusCode = 403;
    throw error;
  }
};

export const getJobs = async (req, res, next) => {
  try {
    const visibilityQuery = await buildVisibilityQuery(req.user);
    const jobs = await Job.find({
      ...visibilityQuery,
      ...buildJobQuery(req.query),
    })
      .populate('recruiterId', 'name companyName email role isApproved')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

export const getJobMatches = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const approvedRecruiterIds = await getApprovedRecruiterIds();
    const jobs = await Job.find({
      recruiterId: { $in: approvedRecruiterIds },
      ...buildJobQuery(req.query),
    }).select('skills');

    const matches = jobs.map((job) => {
      const match = calculateMatch(profile?.skills || [], job.skills || []);

      return {
        jobId: job._id,
        ...match,
      };
    });

    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'recruiterId',
      'name companyName email role isApproved',
    );

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    const isOwner = req.user && job.recruiterId?._id?.toString() === req.user._id.toString();
    const isVisibleByApproval = job.recruiterId?.isApproved;

    if (!isVisibleByApproval && !(req.user?.role === 'admin' || isOwner)) {
      res.status(404);
      throw new Error('Job not found');
    }

    res.json({ job });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const jobData = normalizeJobPayload(req.body);

    if (!jobData.title || !jobData.description || !jobData.location) {
      res.status(400);
      throw new Error('Title, description, and location are required');
    }

    if (jobData.salary !== undefined && Number.isNaN(jobData.salary)) {
      res.status(400);
      throw new Error('Salary must be a valid number');
    }

    if (req.user.role === 'recruiter' && !req.user.isApproved) {
      res.status(403);
      throw new Error('Your recruiter account must be approved before posting jobs');
    }

    const job = await Job.create({
      ...jobData,
      recruiterId: req.user._id,
      status: 'approved',
    });

    const populatedJob = await job.populate('recruiterId', 'name companyName email role isApproved');

    res.status(201).json({ job: populatedJob });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    ensureJobOwnerOrAdmin(job, req.user);
    
    const updatedJobData = normalizeJobPayload(req.body);

    if (!updatedJobData.title || !updatedJobData.description || !updatedJobData.location) {
      res.status(400);
      throw new Error('Title, description, and location are required');
    }

    if (updatedJobData.salary !== undefined && Number.isNaN(updatedJobData.salary)) {
      res.status(400);
      throw new Error('Salary must be a valid number');
    }

    Object.assign(job, updatedJobData);
    await job.save();

    const populatedJob = await job.populate('recruiterId', 'name companyName email role isApproved');

    res.json({ job: populatedJob });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    ensureJobOwnerOrAdmin(job, req.user);

    await Application.deleteMany({ jobId: job._id });
    await job.deleteOne();

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};

export const getAllJobsAdmin = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate('recruiterId', 'name companyName email role isApproved')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

export const updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid job status');
    }

    const job = await Job.findById(req.params.id).populate(
      'recruiterId',
      'name email role',
    );

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    job.status = status;
    await job.save();

    res.json({ job });
  } catch (error) {
    next(error);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalJobs, totalApplications, blockedUsers, pendingRecruiters] =
      await Promise.all([
        User.countDocuments(),
        Job.countDocuments(),
        Application.countDocuments(),
        User.countDocuments({ isBlocked: true }),
        User.countDocuments({ role: 'recruiter', isApproved: false }),
      ]);

    res.json({
      stats: {
        totalUsers,
        totalJobs,
        totalApplications,
        blockedUsers,
        pendingJobs: pendingRecruiters,
      },
    });
  } catch (error) {
    next(error);
  }
};
