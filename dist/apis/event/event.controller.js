import * as eventService from './event.service.js';
import { broadcastEventChange } from './event.sse.js';
export const getEvents = async (req, res) => {
    try {
        const events = await eventService.findAllEvents();
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const getEventById = async (req, res) => {
    try {
        const id = req.params.id;
        const event = await eventService.findEventById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }
        res.json({
            success: true,
            data: event
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const createEvent = async (req, res) => {
    try {
        let imagePath = undefined;
        if (req.file) {
            imagePath = `uploads/events/${req.file.filename}`;
        }
        const eventData = {
            ...req.body,
            creadoPor: req.user?._id,
            ...(req.file ? { image: `uploads/events/${req.file.filename}` } : {})
        };
        const event = await eventService.createEvent(eventData);
        broadcastEventChange('event_created', event); // 👈
        res.status(201).json({
            success: true,
            message: "Evento creado exitosamente",
            data: event
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        if (errorMessage.startsWith('CONFLICT_SALA::')) {
            const conflictData = JSON.parse(errorMessage.replace('CONFLICT_SALA::', ''));
            return res.status(409).json({
                success: false,
                error: 'Conflicto de sala detectado. Es obligatorio realizar una reasignación.',
                conflict: conflictData,
                requiresReassignment: true
            });
        }
        res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
};
export const updateEvent = async (req, res) => {
    try {
        const id = req.params.id;
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = `uploads/events/${req.file.filename}`;
            // Eliminar imagen anterior
            const oldEvent = await eventService.findEventById(id);
            if (oldEvent?.image) {
                const fs = await import('fs');
                const path = await import('path');
                const oldImagePath = path.join(process.cwd(), oldEvent.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        const event = await eventService.updateEvent(id, updateData);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }
        broadcastEventChange('event_updated', event); // 👈
        res.json({
            success: true,
            message: "Evento actualizado exitosamente",
            data: event
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        if (errorMessage.startsWith('CONFLICT_SALA::')) {
            const conflictData = JSON.parse(errorMessage.replace('CONFLICT_SALA::', ''));
            return res.status(409).json({
                success: false,
                error: 'Conflicto de sala detectado. Es obligatorio realizar una reasignación.',
                conflict: conflictData,
                requiresReassignment: true
            });
        }
        res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
};
export const deleteEvent = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('🔴 DELETE llamado con id:', id);
        const found = await eventService.findEventById(id);
        console.log('🔴 findById resultado:', found);
        const event = await eventService.deleteEvent(id);
        console.log('🔴 deleteEvent resultado:', event);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }
        broadcastEventChange('event_deleted', event);
        res.json({ success: true, message: "Evento eliminado exitosamente" });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const deactivateEvent = async (req, res) => {
    try {
        const id = req.params.id;
        const event = await eventService.deactivateEvent(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }
        res.json({
            success: true,
            message: "Evento desactivado exitosamente",
            data: event
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const updateCupos = async (req, res) => {
    try {
        const id = req.params.id;
        const cantidad = Number(req.body.cantidad);
        const event = await eventService.updateCuposDisponibles(id, cantidad);
        res.json({
            success: true,
            message: "Cupos actualizados exitosamente",
            data: event
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const getActiveEvents = async (req, res) => {
    try {
        const events = await eventService.findActiveEvents();
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const getEventsByDestino = async (req, res) => {
    try {
        const destinoId = req.params.destinoId;
        const events = await eventService.findEventsByDestino(destinoId);
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const uploadEventImage = async (req, res) => {
    try {
        const id = req.params.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ninguna imagen'
            });
        }
        // ✅ Con CloudinaryStorage, la URL pública ya viene en req.file.path
        const imageUrl = req.file.path;
        const publicId = req.file.filename; // public_id de Cloudinary
        console.log('☁️  [uploadEventImage] imageUrl:', imageUrl);
        console.log('☁️  [uploadEventImage] publicId:', publicId);
        const event = await eventService.updateEventImage(id, imageUrl, publicId);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        }
        res.json({ success: true, data: event, imageUrl });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
export const deleteEventImage = async (req, res) => {
    try {
        const id = req.params.id;
        const event = await eventService.deleteEventImage(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }
        res.json({
            success: true,
            data: event
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
/* ── Reasignación atómica (solo superadmin) ── */
export const reasignarYCrear = async (req, res) => {
    try {
        const { eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, nuevoEvento } = req.body;
        console.log('reasignarYCrear request body:', { eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, nuevoEvento });
        if (!eventoPrevioId || !nuevoEvento)
            return res.status(400).json({ success: false, error: 'Faltan datos para reasignación' });
        // Pasar valores tal cual; si vienen vacíos se interpretan como no modificados.
        const event = await eventService.reasignarYCrear(eventoPrevioId, nuevaEspacioId || undefined, nuevaDestinoPrevioId || undefined, nuevoEvento);
        res.status(201).json({ success: true, message: "Evento creado con reasignación", data: event });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const reasignarYActualizar = async (req, res) => {
    try {
        const { eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, updateData } = req.body;
        console.log('reasignarYActualizar request body:', { eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, updateData, eventId: req.params.id });
        if (!eventoPrevioId || !updateData)
            return res.status(400).json({ success: false, error: 'Faltan datos para reasignación' });
        const event = await eventService.reasignarYActualizar(eventoPrevioId, nuevaEspacioId || undefined, nuevaDestinoPrevioId || undefined, req.params.id, updateData);
        res.json({ success: true, message: "Evento actualizado con reasignación", data: event });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
};
export const confirmAssistence = async (req, res) => {
    try {
        const { userId, eventoId } = req.params;
        const { estadoAsistencia } = req.body; // 👈 recibe el estado
        await eventService.confirmAssistence(userId, eventoId, estadoAsistencia);
        res.json({ success: true, message: "Asistencia actualizada" });
    }
    catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ success: false, message: "Error al confirmar asistencia" });
    }
};
