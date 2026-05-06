import express from 'express';
import {
  applyForJob,
  downloadApplicationResume,
  getAllApplications,
  getMyApplications,
  getRecruiterApplications,
  sendShortlistedCandidateMessage,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/me', protect, authorizeRoles('candidate'), getMyApplications);
router.get(
  '/:id/resume',
  protect,
  authorizeRoles('candidate', 'recruiter', 'admin'),
  downloadApplicationResume,
);
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
router.post(
  '/:id/message',
  protect,
  authorizeRoles('recruiter', 'admin'),
  sendShortlistedCandidateMessage,
);

export default router;
