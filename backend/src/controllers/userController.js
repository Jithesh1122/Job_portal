import User from '../models/User.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import generateToken from '../utils/generateToken.js';

const sendAuthResponse = (res, statusCode, user) => {
  res.status(statusCode).json({
    token: generateToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
    },
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedRoles = ['candidate', 'recruiter'];

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email, and password are required');
    }

    if (role && !allowedRoles.includes(role)) {
      res.status(403);
      throw new Error('Invalid role for public registration');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'candidate',
    });

    sendAuthResponse(res, 201, user);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error('Your account has been blocked');
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isBlocked: req.user.isBlocked,
    },
  });
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserBlockStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Admin cannot block the currently logged in user');
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Admin cannot delete the currently logged in user');
    }

    const ownedJobs = await Job.find({ recruiterId: user._id }).select('_id');
    const ownedJobIds = ownedJobs.map((job) => job._id);

    await Profile.deleteOne({ user: user._id });
    await Application.deleteMany({
      $or: [{ userId: user._id }, { jobId: { $in: ownedJobIds } }],
    });
    await Notification.deleteMany({ userId: user._id });
    await Job.deleteMany({ recruiterId: user._id });
    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
