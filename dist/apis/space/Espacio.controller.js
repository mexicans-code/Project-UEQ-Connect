import * as espacioService from "./Espacio.service.js";
import { cloudinary } from "../../config/multer.config.js";
/* ── Extrae public_id de Cloudinary desde la URL completa ── */
const getPublicId = (url) => {
    // URL de Cloudinary: https://res.cloudinary.com/<cloud>/image/upload/v123/<folder>/<name>.<ext>
    // Nos quedamos con todo desde la carpeta hacia adelante, sin la extensión
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    return match ? match[1] : url;
};
/* ── GET /api/espacios ── */
export const getEspacios = async (req, res) => {
    try {
        const espacios = await espacioService.findAllEspacios();
        res.json({ success: true, data: espacios });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── GET /api/espacios/:id ── */
export const getEspacioById = async (req, res) => {
    try {
        const espacio = await espacioService.findEspacioById(req.params.id);
        if (!espacio)
            return res.status(404).json({ success: false, error: "Espacio no encontrado" });
        res.json({ success: true, data: espacio });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── GET /api/espacios/destino/:destinoId ── */
export const getEspaciosByDestino = async (req, res) => {
    try {
        const espacios = await espacioService.findEspaciosByDestino(req.params.destinoId);
        res.json({ success: true, data: espacios });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── GET /api/espacios/destino/:destinoId/disponibles ── */
export const getEspaciosDisponiblesByDestino = async (req, res) => {
    try {
        const espacios = await espacioService.findEspaciosDisponiblesByDestino(req.params.destinoId);
        res.json({ success: true, data: espacios });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
export const getEspaciosSugeridos = async (req, res) => {
    try {
        const destinoId = req.query.destinoId;
        const fecha = req.query.fecha;
        const horaInicio = req.query.horaInicio;
        const horaFin = req.query.horaFin;
        const cupos = Number(req.query.cupos);
        const espacios = await espacioService.findEspaciosSugeridos(fecha, horaInicio, horaFin, cupos, destinoId);
        res.json({ success: true, data: espacios });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── POST /api/espacios ── */
export const createEspacio = async (req, res) => {
    try {
        const { nombre, destino, cupos, planta, descripcion } = req.body;
        // Validación de campos requeridos
        if (!nombre || !destino || !cupos || !planta) {
            return res.status(400).json({
                success: false,
                error: "Faltan datos requeridos: nombre, destino, cupos, planta",
            });
        }
        // Validar planta
        const plantasValidas = ["Planta baja", "Planta alta", "Planta única"];
        if (!plantasValidas.includes(planta)) {
            return res.status(400).json({
                success: false,
                error: `Planta inválida. Valores permitidos: ${plantasValidas.join(", ")}`,
            });
        }
        // Validar cupos como número positivo
        const cuposNum = Number(cupos);
        if (isNaN(cuposNum) || cuposNum < 1) {
            return res.status(400).json({ success: false, error: "Los cupos deben ser un número mayor a 0" });
        }
        const espacio = await espacioService.createEspacio({
            nombre: String(nombre).trim(),
            destino,
            cupos: cuposNum,
            planta,
            descripcion: descripcion ? String(descripcion).trim() : undefined,
            ocupado: false,
        });
        res.status(201).json({ success: true, message: "Espacio creado exitosamente", data: espacio });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── PUT /api/espacios/:id ── */
export const updateEspacio = async (req, res) => {
    try {
        const { nombre, destino, cupos, planta, descripcion, ocupado } = req.body;
        // Validar planta si viene en el body
        if (planta !== undefined) {
            const plantasValidas = ["Planta baja", "Planta alta", "Planta única"];
            if (!plantasValidas.includes(planta)) {
                return res.status(400).json({
                    success: false,
                    error: `Planta inválida. Valores permitidos: ${plantasValidas.join(", ")}`,
                });
            }
        }
        // Validar cupos si vienen en el body
        if (cupos !== undefined) {
            const cuposNum = Number(cupos);
            if (isNaN(cuposNum) || cuposNum < 1) {
                return res.status(400).json({ success: false, error: "Los cupos deben ser un número mayor a 0" });
            }
        }
        // Construir objeto de actualización con solo los campos presentes
        const updateData = {};
        if (nombre !== undefined)
            updateData.nombre = String(nombre).trim();
        if (destino !== undefined)
            updateData.destino = destino;
        if (cupos !== undefined)
            updateData.cupos = Number(cupos);
        if (planta !== undefined)
            updateData.planta = planta;
        if (descripcion !== undefined)
            updateData.descripcion = String(descripcion).trim();
        if (ocupado !== undefined)
            updateData.ocupado = Boolean(ocupado);
        const espacio = await espacioService.updateEspacio(req.params.id, updateData);
        if (!espacio)
            return res.status(404).json({ success: false, error: "Espacio no encontrado" });
        res.json({ success: true, message: "Espacio actualizado exitosamente", data: espacio });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── DELETE /api/espacios/:id ── */
export const deleteEspacio = async (req, res) => {
    try {
        // Eliminar imagen de Cloudinary si existe
        const espacio = await espacioService.findEspacioById(req.params.id);
        if (!espacio)
            return res.status(404).json({ success: false, error: "Espacio no encontrado" });
        if (espacio.image) {
            try {
                await cloudinary.uploader.destroy(getPublicId(espacio.image));
            }
            catch { }
        }
        await espacioService.deleteEspacio(req.params.id);
        res.json({ success: true, message: "Espacio eliminado exitosamente" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── PATCH /api/espacios/:id/ocupado ── */
export const toggleOcupado = async (req, res) => {
    try {
        const { ocupado } = req.body;
        if (typeof ocupado !== "boolean") {
            return res.status(400).json({ success: false, error: "El campo 'ocupado' debe ser boolean" });
        }
        const espacio = await espacioService.setOcupado(req.params.id, ocupado);
        if (!espacio)
            return res.status(404).json({ success: false, error: "Espacio no encontrado" });
        res.json({
            success: true,
            message: `Espacio marcado como ${ocupado ? "ocupado" : "disponible"}`,
            data: espacio,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── POST /api/espacios/:id/image ── */
export const uploadImage = async (req, res) => {
    try {
        const espacio = await espacioService.findEspacioById(req.params.id);
        if (!espacio)
            return res.status(404).json({ success: false, error: "Espacio no encontrado" });
        if (!req.file)
            return res.status(400).json({ success: false, error: "No se proporcionó imagen" });
        // Eliminar imagen anterior de Cloudinary si existe
        if (espacio.image) {
            try {
                await cloudinary.uploader.destroy(getPublicId(espacio.image));
            }
            catch { }
        }
        const updated = await espacioService.updateEspacio(req.params.id, { image: req.file.path });
        res.json({ success: true, message: "Imagen subida correctamente", data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
/* ── DELETE /api/espacios/:id/image ── */
export const deleteImage = async (req, res) => {
    try {
        const espacio = await espacioService.findEspacioById(req.params.id);
        if (!espacio)
            return res.status(404).json({ success: false, error: "Espacio no encontrado" });
        if (espacio.image) {
            try {
                await cloudinary.uploader.destroy(getPublicId(espacio.image));
            }
            catch { }
        }
        const updated = await espacioService.updateEspacio(req.params.id, { image: null });
        res.json({ success: true, message: "Imagen eliminada correctamente", data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Error desconocido" });
    }
};
