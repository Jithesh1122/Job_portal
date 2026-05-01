import express from 'express';
import {
  applyForJob,
  getMyApplications,
} from '../controllers/applicationController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('candidate'));

router.get('/me', getMyApplications);
router.post('/jobs/:jobId', uploadResume.single('resume'), applyForJob);

export default router;
