import express from 'express';
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from '../controllers/jobController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getJobs)
  .post(protect, authorizeRoles('recruiter', 'admin'), createJob);

router
  .route('/:id')
  .get(getJobById)
  .put(protect, authorizeRoles('recruiter', 'admin'), updateJob)
  .delete(protect, authorizeRoles('recruiter', 'admin'), deleteJob);

export default router;
