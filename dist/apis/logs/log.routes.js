import * as express from 'express';
import { getLogs } from './log.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = express.Router();
router.get('/', authenticateToken, getLogs);
export default router;
