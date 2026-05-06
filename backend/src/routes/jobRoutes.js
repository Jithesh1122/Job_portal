import express from 'express';
import {
  createJob,
  deleteJob,
  getAllJobsAdmin,
  getJobById,
  getJobMatches,
  getJobs,
  getPlatformStats,
  updateJob,
  updateJobStatus,
} from '../controllers/jobController.js';
import { authorizeRoles, optionalProtect, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(optionalProtect, getJobs)
  .post(protect, authorizeRoles('recruiter', 'admin'), createJob);

router.get('/admin', protect, authorizeRoles('admin'), getAllJobsAdmin);
router.get('/admin/stats', protect, authorizeRoles('admin'), getPlatformStats);
router.patch('/admin/:id/status', protect, authorizeRoles('admin'), updateJobStatus);
router.get('/matches', protect, authorizeRoles('candidate'), getJobMatches);

router
  .route('/:id')
  .get(optionalProtect, getJobById)
  .put(protect, authorizeRoles('recruiter', 'admin'), updateJob)
  .delete(protect, authorizeRoles('recruiter', 'admin'), deleteJob);

export default router;
