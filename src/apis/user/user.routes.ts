import express from 'express';
import {
  getProfile,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deactivateUser,
  activateUser,
  deleteUser,
  updateProfileImage,
  deleteProfileImage
} from './user.controller.js';
import { 
  authenticateToken, 
  requireAdmin,
  requireRole 
} from '../middleware/auth.middleware.js';

const router = express.Router();

// ========== RUTAS PROTEGIDAS (Usuario autenticado) ==========
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePassword);
router.put('/profile-image', authenticateToken, updateProfileImage);
router.delete('/profile-image', authenticateToken, deleteProfileImage);

// ========== RUTAS DE ADMINISTRACIÓN (Solo admin/superadmin) ==========
router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.get('/:id', authenticateToken, requireAdmin, getUserById);
router.put('/:id', authenticateToken, requireAdmin, updateUser);
router.patch('/:id/deactivate', authenticateToken, requireAdmin, deactivateUser);
router.patch('/:id/activate', authenticateToken, requireAdmin, activateUser);

// ========== SOLO SUPERADMIN ==========
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteUser);

export default router;