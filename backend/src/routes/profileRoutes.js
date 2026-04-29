import express from 'express';
import {
  getMyProfile,
  getProfilesForRecruiters,
  upsertMyProfile,
} from '../controllers/profileController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/me')
  .get(getMyProfile)
  .put(upsertMyProfile);

router.get(
  '/candidates',
  authorizeRoles('recruiter', 'admin'),
  getProfilesForRecruiters,
);

export default router;
