import * as express from 'express';
import {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    getAllAddresses,
    uploadLocationImage,
    deleteLocationImage
} from './location.controller.js';
import { upload } from '../../config/multer.config.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getLocations);
router.get('/getAllAddresses', getAllAddresses);
router.get('/:id', getLocationById);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateLocation);
router.delete('/:id', authenticateToken, requireAdmin, deleteLocation);
router.post('/:id/image', authenticateToken, requireAdmin, upload.single('image'), uploadLocationImage);
router.delete('/:id/image', authenticateToken, requireAdmin, deleteLocationImage);

export default router;