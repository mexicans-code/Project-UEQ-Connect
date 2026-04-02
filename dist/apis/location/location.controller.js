import * as locationService from './location.service.js';
import { cloudinary } from '../../config/multer.config.js';
// Helper: extrae el public_id de una URL de Cloudinary para poder borrarla
const getPublicId = (url) => {
    if (!url)
        return null;
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<public_id>.<ext>
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    return match ? match[1] : null;
};
export const getLocations = async (req, res) => {
    try {
        const destinos = await locationService.findAllDestinos();
        res.json({ success: true, data: destinos });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const getLocationById = async (req, res) => {
    try {
        const id = req.params.id;
        const destino = await locationService.findDestinoById(id);
        if (!destino)
            return res.status(404).json({ success: false, error: 'Destino no encontrado' });
        res.json({ success: true, data: destino });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const createLocation = async (req, res) => {
    try {
        const { nombre, posicion } = req.body;
        if (!nombre || !posicion || !posicion.latitude || !posicion.longitude) {
            return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
        }
        // Cloudinary devuelve la URL completa en req.file.path
        const imageUrl = req.file?.path;
        const destino = await locationService.createDestino({ nombre, posicion, image: imageUrl });
        res.status(201).json({ success: true, data: destino });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const updateLocation = async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, posicion } = req.body;
        const updateData = {};
        if (nombre)
            updateData.nombre = nombre;
        if (posicion)
            updateData.posicion = posicion;
        if (req.file) {
            // Borrar imagen anterior de Cloudinary
            const oldDestino = await locationService.findDestinoById(id);
            const publicId = getPublicId(oldDestino?.image);
            if (publicId)
                await cloudinary.uploader.destroy(publicId);
            updateData.image = req.file.path; // URL completa de Cloudinary
        }
        const destino = await locationService.updateDestino(id, updateData);
        if (!destino)
            return res.status(404).json({ success: false, error: 'Destino no encontrado' });
        res.json({ success: true, data: destino });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const deleteLocation = async (req, res) => {
    try {
        const id = req.params.id;
        // Borrar imagen de Cloudinary antes de eliminar el registro
        const destino = await locationService.findDestinoById(id);
        const publicId = getPublicId(destino?.image);
        if (publicId)
            await cloudinary.uploader.destroy(publicId);
        const deleted = await locationService.deleteDestino(id);
        if (!deleted)
            return res.status(404).json({ success: false, error: 'Destino no encontrado' });
        res.json({ success: true, message: 'Destino eliminado correctamente' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const getAllAddresses = async (req, res) => {
    try {
        const destinos = await locationService.findAllDestinos();
        const addresses = destinos.map(d => ({ nombre: d.nombre, posicion: d.posicion, image: d.image }));
        res.json({ success: true, data: addresses });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const uploadLocationImage = async (req, res) => {
    try {
        const id = req.params.id;
        if (!req.file)
            return res.status(400).json({ success: false, error: 'No se ha proporcionado ninguna imagen' });
        // Borrar imagen anterior
        const oldDestino = await locationService.findDestinoById(id);
        const publicId = getPublicId(oldDestino?.image);
        if (publicId)
            await cloudinary.uploader.destroy(publicId);
        const imageUrl = req.file.path; // URL completa de Cloudinary
        const destino = await locationService.updateDestinoImage(id, imageUrl);
        if (!destino)
            return res.status(404).json({ success: false, error: 'Destino no encontrado' });
        res.json({ success: true, data: destino, imageUrl });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const deleteLocationImage = async (req, res) => {
    try {
        const id = req.params.id;
        const destino = await locationService.findDestinoById(id);
        const publicId = getPublicId(destino?.image);
        if (publicId)
            await cloudinary.uploader.destroy(publicId);
        const updated = await locationService.deleteDestinoImage(id);
        if (!updated)
            return res.status(404).json({ success: false, error: 'Destino no encontrado' });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
