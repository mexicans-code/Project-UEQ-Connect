import { GraphNode, GraphEdge } from './graph.model.js';
export const findAllNodes = async () => {
    try {
        return await GraphNode.find().lean();
    }
    catch {
        throw new Error('Error obteniendo nodos del grafo');
    }
};
export const findAllEdges = async () => {
    try {
        return await GraphEdge.find().lean();
    }
    catch {
        throw new Error('Error obteniendo aristas del grafo');
    }
};
// Devuelve nodos + aristas en una sola llamada
// La app lo carga al inicio y guarda en memoria
export const findFullGraph = async () => {
    try {
        const [nodes, edges] = await Promise.all([
            GraphNode.find().lean(),
            GraphEdge.find().lean(),
        ]);
        return { nodes, edges };
    }
    catch {
        throw new Error('Error obteniendo el grafo completo');
    }
};
