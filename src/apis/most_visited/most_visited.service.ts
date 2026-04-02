import mostVisited from './most_visited.model.js';
import Destino from '../location/location.model.js';


export const findAllMostvisited = async () => {
    try {
        const mostVisiteds = await mostVisited.find().sort({ rank: 1 });

        // Trae todos los destinos de una sola vez en lugar de uno por uno
        const destinos = await Destino.find().select('nombre image');

        const result = mostVisiteds.map((item) => {
            // Normaliza acentos para comparar
            const normalize = (str: string) =>
                str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

            const destino = destinos.find(
                (d) => normalize(d.nombre) === normalize(item.nombre)
            );

            return {
                ...item.toObject(),
                image: destino?.image || null,
            };
        });

        return result;
    } catch (error) {
        throw new Error('Error obteniendo los más visitados');
    }
};