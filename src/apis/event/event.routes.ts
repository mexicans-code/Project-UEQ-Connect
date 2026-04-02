import * as express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  deactivateEvent,
  updateCupos,
  getActiveEvents,
  getEventsByDestino,
  uploadEventImage,
  deleteEventImage,
  reasignarYCrear,
  reasignarYActualizar,
  confirmAssistence
} from './event.controller.js';
import { upload } from '../../config/multer.config.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/active', getActiveEvents);
router.get('/destino/:destinoId', getEventsByDestino);
router.patch('/:eventoId/confirm-assistence/:userId', confirmAssistence);
router.get('/:id', getEventById);
router.post('/reasignar-crear', reasignarYCrear);

router.post('/', upload.single('image'), authenticateToken, createEvent);
router.put('/:id', upload.single('image'), authenticateToken, updateEvent);
router.put('/:id/reasignar-actualizar', authenticateToken, reasignarYActualizar);

router.delete('/:id', authenticateToken, deleteEvent);
router.patch('/:id/deactivate', authenticateToken, deactivateEvent);
router.patch('/:id/cupos', updateCupos);
router.post('/:id/image', upload.single('image'), uploadEventImage);
router.delete('/:id/image', deleteEventImage);

export default router;