import express from 'express';
import {
  approveRecruiter,
  deleteUser,
  getAllUsers,
  getUserProfile,
  loginUser,
  registerUser,
  toggleUserBlockStatus,
} from '../controllers/userController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/admin', protect, authorizeRoles('admin'), getAllUsers);
router.patch('/admin/:id/approve', protect, authorizeRoles('admin'), approveRecruiter);
router.patch('/admin/:id/block', protect, authorizeRoles('admin'), toggleUserBlockStatus);
router.delete('/admin/:id', protect, authorizeRoles('admin'), deleteUser);

export default router;
