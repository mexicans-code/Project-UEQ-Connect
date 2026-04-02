import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { upload } from '../../config/multer.config.js';
import { getAllPersonal, getPersonalById, createNewPersonal, updatePersonalById, deletePersonalById, getPersonalByDepartamento, getPersonalByEstatus, getPersonalConUbicacion, getProfesorConUbicacion, searchPersonal, updatePersonalProfileImage, deletePersonalProfileImage, updatePersonalScheduleImage, deletePersonalScheduleImage } from './personal.controller.js';
const router = Router();
// Rutas de búsqueda
router.get('/buscar', searchPersonal);
router.get('/departamento/:departamento', getPersonalByDepartamento);
router.get('/estatus/:estatus', getPersonalByEstatus);
router.get('/ubicacion/departamento/:departamento', getPersonalConUbicacion);
router.get('/ubicacion/profesor/:numeroEmpleado', getProfesorConUbicacion);
// Rutas CRUD
router.get('/', getAllPersonal);
router.get('/:id', getPersonalById);
router.post('/', authenticateToken, requireAdmin, createNewPersonal);
router.put('/:id', authenticateToken, requireAdmin, updatePersonalById);
router.put('/:id/profile-image', authenticateToken, upload.single('image'), updatePersonalProfileImage);
router.delete('/:id/profile-image', authenticateToken, deletePersonalProfileImage);
router.put('/:id/schedule-image', authenticateToken, requireAdmin, upload.single('image'), updatePersonalScheduleImage);
router.delete('/:id/schedule-image', authenticateToken, requireAdmin, deletePersonalScheduleImage);
router.delete('/:id', authenticateToken, requireAdmin, deletePersonalById);
export default router;
