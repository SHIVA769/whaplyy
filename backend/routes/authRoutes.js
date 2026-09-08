import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  impersonateCompany,
} from '../controllers/authController.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated user actions
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

// Impersonate Company (Super Admin only)
router.post('/impersonate/:companyId', authenticate, requireRole([ROLES.SUPER_ADMIN]), impersonateCompany);

export default router;
