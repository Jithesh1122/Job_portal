import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

const normalizeJobPayload = (payload) => ({
  title: payload.title,
  description: payload.description,
  skills: Array.isArray(payload.skills)
    ? payload.skills.map((skill) => skill.trim()).filter(Boolean)
    : [],
  salary: payload.salary === '' || payload.salary === undefined ? undefined : Number(payload.salary),
  location: payload.location,
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

const buildVisibilityQuery = (user) => {
  if (!user) {
    return { status: 'approved' };
  }

  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'recruiter') {
    return {
      $or: [{ status: 'approved' }, { recruiterId: user._id }],
    };
  }

  return { status: 'approved' };
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

const normalizeSkills = (skills = []) =>
  skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean);

const calculateMatch = (profileSkills, jobSkills) => {
  const normalizedProfileSkills = new Set(normalizeSkills(profileSkills));
  const normalizedJobSkills = normalizeSkills(jobSkills);

  if (normalizedJobSkills.length === 0) {
    return {
      matchedSkills: [],
      matchPercentage: 0,
    };
  }

  const matchedSkills = normalizedJobSkills.filter((skill) =>
    normalizedProfileSkills.has(skill),
  );

  return {
    matchedSkills,
    matchPercentage: Math.round(
      (matchedSkills.length / normalizedJobSkills.length) * 100,
    ),
  };
};

export const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({
      ...buildVisibilityQuery(req.user),
      ...buildJobQuery(req.query),
    })
      .populate('recruiterId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

export const getJobMatches = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const jobs = await Job.find({
      status: 'approved',
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
      'name email role',
    );

    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    const isOwner = req.user && job.recruiterId?._id?.toString() === req.user._id.toString();

    if (job.status !== 'approved' && !(req.user?.role === 'admin' || isOwner)) {
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

    const job = await Job.create({
      ...jobData,
      recruiterId: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
    });

    const populatedJob = await job.populate('recruiterId', 'name email role');

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

    Object.assign(job, normalizeJobPayload(req.body));
    await job.save();

    const populatedJob = await job.populate('recruiterId', 'name email role');

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
      .populate('recruiterId', 'name email role')
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
    const [totalUsers, totalJobs, totalApplications, blockedUsers, pendingJobs] =
      await Promise.all([
        User.countDocuments(),
        Job.countDocuments(),
        Application.countDocuments(),
        User.countDocuments({ isBlocked: true }),
        Job.countDocuments({ status: 'pending' }),
      ]);

    res.json({
      stats: {
        totalUsers,
        totalJobs,
        totalApplications,
        blockedUsers,
        pendingJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};
