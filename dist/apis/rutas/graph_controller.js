import * as graphService from './graph_service.js';
// GET /api/grafo/nodos
export const getNodes = async (req, res) => {
    try {
        const nodes = await graphService.findAllNodes();
        res.json({ success: true, data: nodes });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
// GET /api/grafo/aristas
export const getEdges = async (req, res) => {
    try {
        const edges = await graphService.findAllEdges();
        res.json({ success: true, data: edges });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
// GET /api/grafo  — nodos + aristas en una sola petición (recomendado para la app)
export const getFullGraph = async (req, res) => {
    try {
        const graph = await graphService.findFullGraph();
        res.json({ success: true, data: graph });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
