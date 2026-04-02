import express from 'express';
import { register, registerAdmin, login } from './auth.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { biometricLogin, getMe } from './auth.controller.js';

const router = express.Router();

// Rutas públicas de autenticación
router.post('/register', register);  // POST /auth/register
router.post('/register-admin', authenticateToken, requireAdmin, registerAdmin);    // POST /auth/register-admin → rol: admin o superadmin
router.post('/login', login);        // POST /auth/login
router.post('/biometric-login', biometricLogin); // POST /auth/biometric-login


router.get('/me', authenticateToken, getMe);


export default router;

