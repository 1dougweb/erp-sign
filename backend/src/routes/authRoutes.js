import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  promoteToAdmin
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);
router.put('/me/password', authenticateToken, changePassword);
router.post('/promote', authenticateToken, isAdmin, promoteToAdmin);

export default router;
