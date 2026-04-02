import { Router } from 'express';
import { getMostVisited } from './most_visited.controller.js';
const router = Router();
router.get('/', getMostVisited);
export default router;
