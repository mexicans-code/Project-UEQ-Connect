import * as express from 'express';
import { getNodes, getEdges, getFullGraph } from './graph_controller.js';

const router = express.Router();

router.get('/',        getFullGraph);  // GET /api/grafo
router.get('/nodos',   getNodes);      // GET /api/grafo/nodos
router.get('/aristas', getEdges);      // GET /api/grafo/aristas

export default router;