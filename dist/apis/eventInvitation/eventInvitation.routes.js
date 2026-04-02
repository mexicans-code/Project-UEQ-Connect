import * as express from 'express';
import { createInvitations, getInvitationByToken, validateToken, getEventInvitations, getEventStats, getUserInvitations, updateInvitationStatus, respondToInvitation, markAttendance, regenerateQR, registerToEvent, getMyTickets } from './eventInvitation.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = express.Router();
// Registro público a evento (requiere autenticación)
router.post('/event/:eventoId/register', authenticateToken, registerToEvent);
// Tickets del usuario (requiere autenticación)
router.get('/my-tickets', authenticateToken, getMyTickets);
// Crear invitaciones masivas (requiere autenticación y probablemente permisos de admin)
router.post('/event/:eventoId/create', authenticateToken, createInvitations);
// Obtener invitación por token (público para que usuarios puedan ver su invitación)
router.get('/token/:token', getInvitationByToken);
// Validar token (público para escáner QR)
router.post('/validate', validateToken);
// Responder invitación (público con token)
router.post('/respond', respondToInvitation);
// Obtener invitaciones de evento (requiere autenticación)
router.get('/event/:eventoId', authenticateToken, getEventInvitations);
// Estadísticas (requiere autenticación)
router.get('/event/:eventoId/stats', authenticateToken, getEventStats);
// Invitaciones de usuario (requiere autenticación)
router.get('/user/:userId', authenticateToken, getUserInvitations);
// Actualizar estado (requiere autenticación)
router.patch('/:id/status', authenticateToken, updateInvitationStatus);
// Marcar asistencia (requiere autenticación)
// Se acepta tanto /attendance (nombre original) como /asistencia (usado por el frontend)
router.patch('/:id/attendance', authenticateToken, markAttendance);
router.patch('/:id/asistencia', authenticateToken, markAttendance);
// Regenerar QR (requiere autenticación)
router.patch('/:id/regenerate-qr', authenticateToken, regenerateQR);
export default router;
