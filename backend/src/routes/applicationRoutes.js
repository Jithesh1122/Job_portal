import express from 'express';
import {
  applyForJob,
  getAllApplications,
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/me', protect, authorizeRoles('candidate'), getMyApplications);
router.post(
  '/jobs/:jobId',
  protect,
  authorizeRoles('candidate'),
  uploadResume.single('resume'),
  applyForJob,
);
router.get(
  '/recruiter',
  protect,
  authorizeRoles('recruiter', 'admin'),
  getRecruiterApplications,
);
router.get(
  '/admin',
  protect,
  authorizeRoles('admin'),
  getAllApplications,
);
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('recruiter', 'admin'),
  updateApplicationStatus,
);

export default router;
