import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const attachAuthenticatedUser = async (req, authHeader, { required }) => {
  if (!authHeader?.startsWith('Bearer ')) {
    if (required) {
      const error = new Error('Not authorized, no token');
      error.statusCode = 401;
      throw error;
    }

    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    const error = new Error('Not authorized, user not found');
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error('User account is blocked');
    error.statusCode = 403;
    throw error;
  }

  req.user = user;
  req.auth = {
    id: decoded.id,
    role: decoded.role,
  };
};

export const protect = async (req, res, next) => {
  try {
    await attachAuthenticatedUser(req, req.headers.authorization, { required: true });
    next();
  } catch (error) {
    res.status(error.statusCode || 401);
    next(error);
  }
};

export const optionalProtect = async (req, res, next) => {
  try {
    await attachAuthenticatedUser(req, req.headers.authorization, { required: false });
    next();
  } catch (error) {
    if (error.statusCode === 401 && !req.headers.authorization) {
      next();
      return;
    }

    res.status(error.statusCode || 401);
    next(error);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Not authorized for this role'));
    }

    return next();
  };
};

export const requireAuth = protect;

export const requireRole = (...roles) => authorizeRoles(...roles);
