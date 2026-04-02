import { findAllMostvisited } from './most_visited.service.js';
export const getMostVisited = async (req, res) => {
    try {
        const mostVisiteds = await findAllMostvisited();
        res.json(mostVisiteds);
    }
    catch (error) {
        res.status(500).json({ message: 'Error obteniendo los más visitados' });
    }
};
