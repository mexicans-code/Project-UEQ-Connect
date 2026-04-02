import Event from './event.model.js';
import EspacioModel from '../space/Espacio.model.js';
import EventInvitation from '../eventInvitation/eventInvitation.model.js';
import fs from 'fs';
import path from 'path';
import { cloudinary } from '../../config/multer.config.js';
/* ─── helpers ─── */
const toMin = (h) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
const hayTraslapeH = (h1i, h1f, h2i, h2f) => toMin(h1i) < toMin(h2f) && toMin(h1f) > toMin(h2i);
/* ─────────────────────────────────────────────
   Queries básicas
───────────────────────────────────────────── */
export const findAllEvents = async () => {
    try {
        return await Event.find()
            .populate("destino")
            .populate("espacio")
            .populate({ path: "creadoPor", select: "nombre email rol" })
            .sort({ fecha: 1, horaInicio: 1 });
    }
    catch {
        throw new Error('Error obteniendo eventos');
    }
};
export const findEventById = async (id) => {
    try {
        return await Event.findById(id)
            .populate("destino")
            .populate("espacio")
            .populate({ path: "creadoPor", select: "nombre email rol" });
    }
    catch {
        throw new Error('Error obteniendo evento');
    }
};
/* ─────────────────────────────────────────────
   Verificación de conflictos
   • SALA  → misma espacio + misma fecha + traslape hora  (duro)
   • LUGAR → mismo destino + misma fecha + traslape hora  (blando/info)
───────────────────────────────────────────── */
export const checkEventConflicts = async (eventData, eventId) => {
    // Normalizar fecha a medianoche UTC
    const fecha = new Date(eventData.fecha || eventData.fechaInicio);
    fecha.setUTCHours(0, 0, 0, 0);
    const fechaSiguiente = new Date(fecha);
    fechaSiguiente.setUTCDate(fechaSiguiente.getUTCDate() + 1);
    const baseQuery = {
        activo: true,
        destino: eventData.destino,
        fecha: { $gte: fecha, $lt: fechaSiguiente },
    };
    if (eventId)
        baseQuery._id = { $ne: eventId };
    const candidatos = await Event.find(baseQuery)
        .populate("espacio")
        .populate({ path: "creadoPor", select: "nombre email rol" })
        .lean();
    const conTraslape = candidatos.filter(ev => hayTraslapeH(eventData.horaInicio, eventData.horaFin, ev.horaInicio, ev.horaFin));
    // Conflicto de SALA (duro): mismo espacio
    const conflictoSala = eventData.espacio
        ? conTraslape.find(ev => {
            const salaEv = ev.espacio?._id?.toString() || ev.espacio?.toString();
            return salaEv && salaEv === eventData.espacio.toString();
        })
        : null;
    // Conflicto de LUGAR (blando/info): mismo destino, sala distinta
    const conflictoLugar = conTraslape.filter(ev => !conflictoSala || ev._id.toString() !== conflictoSala._id.toString());
    return { conflictoSala: conflictoSala || null, conflictoLugar };
};
/* ─────────────────────────────────────────────
   Crear evento  (forzar:true salta validación de sala)
───────────────────────────────────────────── */
export const createEvent = async (eventData) => {
    try {
        if (eventData.cuposDisponibles === undefined) {
            eventData.cuposDisponibles = eventData.cupos;
        }
        const fecha = new Date(eventData.fecha || eventData.fechaInicio);
        if (isNaN(fecha.getTime()))
            throw new Error('Fecha inválida');
        fecha.setUTCHours(0, 0, 0, 0);
        if (!eventData.forzar) {
            const totalEspacios = await EspacioModel.countDocuments({ destino: eventData.destino });
            if (totalEspacios === 0) {
                throw new Error("El lugar seleccionado no tiene espacios registrados y no se puede crear el evento.");
            }
        }
        if (!eventData.forzar) {
            const hoy = new Date();
            hoy.setUTCHours(0, 0, 0, 0);
            if (fecha < hoy)
                throw new Error("No se pueden crear eventos en fechas pasadas");
            if (fecha.getTime() === hoy.getTime()) {
                const ahora = new Date();
                const [hh, mm] = eventData.horaInicio.split(':').map(Number);
                const inicioMin = hh * 60 + mm;
                const ahoraMin = ahora.getUTCHours() * 60 + ahora.getUTCMinutes();
                if (inicioMin <= ahoraMin)
                    throw new Error("No se pueden crear eventos en horarios que ya pasaron");
            }
        }
        if (!eventData.forzar) {
            const { conflictoSala } = await checkEventConflicts(eventData);
            if (conflictoSala) {
                throw new Error(`CONFLICT_SALA::${JSON.stringify({
                    id: conflictoSala._id,
                    titulo: conflictoSala.titulo,
                    horaInicio: conflictoSala.horaInicio,
                    horaFin: conflictoSala.horaFin,
                })}`);
            }
        }
        const [horaFin, minutosFin] = eventData.horaFin.split(':').map(Number);
        const desactivarEn = new Date(fecha);
        desactivarEn.setUTCHours(horaFin, minutosFin, 0, 0);
        desactivarEn.setMinutes(desactivarEn.getMinutes() + 15);
        const { forzar, fechaInicio, fechaFin, ...datos } = eventData;
        const event = new Event({ ...datos, fecha, desactivarEn });
        await event.save();
        return event;
    }
    catch (error) {
        throw error;
    }
};
/* ─────────────────────────────────────────────
   Actualizar evento
───────────────────────────────────────────── */
export const updateEvent = async (id, eventData) => {
    try {
        if (!eventData.forzar && eventData.destino) {
            const totalEspacios = await EspacioModel.countDocuments({ destino: eventData.destino });
            if (totalEspacios === 0) {
                throw new Error("El lugar seleccionado no tiene espacios registrados y no se puede actualizar el evento.");
            }
        }
        if (!eventData.forzar && eventData.allowPastDate === false && (eventData.fecha || eventData.fechaInicio || eventData.horaInicio)) {
            if (eventData.cuposDisponibles !== undefined && eventData.cupos !== undefined &&
                eventData.cuposDisponibles > eventData.cupos)
                throw new Error("Los cupos disponibles no pueden ser mayores que los cupos totales");
            if (!eventData.forzar && (eventData.fecha || eventData.fechaInicio || eventData.horaInicio)) {
                const fechaCandidata = new Date(eventData.fecha || eventData.fechaInicio);
                if (!isNaN(fechaCandidata.getTime())) {
                    fechaCandidata.setUTCHours(0, 0, 0, 0);
                    const hoy = new Date();
                    hoy.setUTCHours(0, 0, 0, 0);
                    if (fechaCandidata < hoy)
                        throw new Error("No se pueden asignar eventos a fechas pasadas");
                    if (fechaCandidata.getTime() === hoy.getTime() && eventData.horaInicio) {
                        const ahora = new Date();
                        const [hh, mm] = eventData.horaInicio.split(':').map(Number);
                        const inicioMin = hh * 60 + mm;
                        const ahoraMin = ahora.getUTCHours() * 60 + ahora.getUTCMinutes();
                        if (inicioMin <= ahoraMin)
                            throw new Error("No se pueden asignar eventos a horarios que ya pasaron");
                    }
                }
            }
            if (!eventData.forzar &&
                (eventData.fecha || eventData.fechaInicio || eventData.horaInicio ||
                    eventData.horaFin || eventData.destino || eventData.espacio)) {
                const existingEvent = await Event.findById(id);
                if (!existingEvent)
                    throw new Error("Evento no encontrado");
                const dataToCheck = {
                    fecha: eventData.fecha || eventData.fechaInicio || existingEvent.fecha,
                    horaInicio: eventData.horaInicio || existingEvent.horaInicio,
                    horaFin: eventData.horaFin || existingEvent.horaFin,
                    destino: eventData.destino || existingEvent.destino,
                    espacio: eventData.espacio || existingEvent.espacio,
                };
                const { conflictoSala } = await checkEventConflicts(dataToCheck, id);
                if (conflictoSala) {
                    throw new Error(`CONFLICT_SALA::${JSON.stringify({
                        id: conflictoSala._id,
                        titulo: conflictoSala.titulo,
                        horaInicio: conflictoSala.horaInicio,
                        horaFin: conflictoSala.horaFin,
                    })}`);
                }
            }
            if (eventData.fecha || eventData.fechaInicio || eventData.horaFin) {
                const ev = await Event.findById(id);
                if (ev) {
                    const fechaBase = new Date(eventData.fecha || eventData.fechaInicio || ev.fecha);
                    fechaBase.setUTCHours(0, 0, 0, 0);
                    const [h, m] = (eventData.horaFin || ev.horaFin).split(':').map(Number);
                    const desactivarEn = new Date(fechaBase);
                    desactivarEn.setUTCHours(h, m, 0, 0);
                    desactivarEn.setMinutes(desactivarEn.getMinutes() + 15);
                    eventData.desactivarEn = desactivarEn;
                    if (eventData.fecha || eventData.fechaInicio) {
                        eventData.fecha = fechaBase;
                        delete eventData.fechaInicio;
                        delete eventData.fechaFin;
                    }
                }
            }
        }
        const { forzar, fechaInicio, fechaFin, ...datos } = eventData;
        const updatedEvent = await Event.findByIdAndUpdate(id, datos, { new: true, runValidators: true })
            .populate("destino")
            .populate("espacio")
            .populate({ path: "creadoPor", select: "nombre email rol" });
        if (updatedEvent) {
            const acceptedCount = await EventInvitation.countDocuments({
                evento: id,
                estadoInvitacion: 'aceptada'
            });
            const newCuposDisponibles = Math.max(0, updatedEvent.cupos - acceptedCount);
            await Event.findByIdAndUpdate(id, { cuposDisponibles: newCuposDisponibles });
            updatedEvent.cuposDisponibles = newCuposDisponibles;
        }
        return updatedEvent;
    }
    catch (error) {
        throw error;
    }
};
/* ─────────────────────────────────────────────
   Reasignación atómica (solo superadmin)
───────────────────────────────────────────── */
export const reasignarYCrear = async (eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, nuevoEventoData) => {
    console.log('ReasignarYCrear - Parámetros recibidos:', { eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, nuevoEventoData });
    const updatePrevio = {};
    if (nuevaEspacioId) {
        updatePrevio.espacio = nuevaEspacioId;
    }
    if (nuevaDestinoPrevioId) {
        updatePrevio.destino = nuevaDestinoPrevioId;
    }
    else if (nuevaEspacioId) {
        const nuevaSala = await EspacioModel.findById(nuevaEspacioId).lean();
        if (nuevaSala?.destino)
            updatePrevio.destino = nuevaSala.destino;
    }
    console.log('ReasignarYCrear - Datos a actualizar en evento previo:', updatePrevio);
    await Event.findByIdAndUpdate(eventoPrevioId, updatePrevio);
    const nuevoEvento = await createEvent({ ...nuevoEventoData, forzar: true });
    console.log('ReasignarYCrear - Nuevo evento creado:', nuevoEvento);
    return nuevoEvento;
};
export const reasignarYActualizar = async (eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, eventoActualizarId, updateData) => {
    console.log('ReasignarYActualizar - Parámetros recibidos:', { eventoPrevioId, nuevaEspacioId, nuevaDestinoPrevioId, eventoActualizarId, updateData });
    const updatePrevio = {};
    if (nuevaEspacioId) {
        updatePrevio.espacio = nuevaEspacioId;
    }
    if (nuevaDestinoPrevioId) {
        updatePrevio.destino = nuevaDestinoPrevioId;
    }
    else if (nuevaEspacioId) {
        const nuevaSala = await EspacioModel.findById(nuevaEspacioId).lean();
        if (nuevaSala?.destino)
            updatePrevio.destino = nuevaSala.destino;
    }
    console.log('ReasignarYActualizar - Datos a actualizar en evento previo:', updatePrevio);
    await Event.findByIdAndUpdate(eventoPrevioId, { $set: updatePrevio }, { new: true, runValidators: true });
    const eventoActualizado = await updateEvent(eventoActualizarId, { ...updateData, forzar: true });
    console.log('ReasignarYActualizar - Evento actualizado:', eventoActualizado);
    return eventoActualizado;
};
/* ─── Resto de funciones ─── */
export const deleteEvent = async (id) => {
    try {
        const event = await Event.findById(id);
        if (event?.image) {
            const p = path.join(process.cwd(), event.image);
            if (fs.existsSync(p))
                fs.unlinkSync(p);
        }
        await Event.findByIdAndDelete(id);
        return event;
    }
    catch {
        throw new Error('Error eliminando evento');
    }
};
export const deactivateEvent = async (id) => {
    try {
        return await Event.findByIdAndUpdate(id, { activo: false }, { new: true });
    }
    catch {
        throw new Error('Error desactivando evento');
    }
};
export const updateCuposDisponibles = async (id, cantidad) => {
    try {
        const event = await Event.findById(id);
        if (!event)
            throw new Error("Evento no encontrado");
        event.cuposDisponibles += cantidad;
        await event.save();
        return event;
    }
    catch (error) {
        throw error;
    }
};
export const findActiveEvents = async () => {
    try {
        return await Event.find({ activo: true })
            .populate("destino")
            .populate("espacio")
            .populate({ path: "creadoPor", select: "nombre email rol" })
            .sort({ fecha: 1, horaInicio: 1 });
    }
    catch {
        throw new Error('Error obteniendo eventos activos');
    }
};
export const findEventsByDestino = async (destinoId) => {
    try {
        return await Event.find({ destino: destinoId })
            .populate("destino")
            .populate("espacio")
            .populate({ path: "creadoPor", select: "nombre email rol" })
            .sort({ fecha: 1, horaInicio: 1 });
    }
    catch {
        throw new Error('Error obteniendo eventos por destino');
    }
};
export const updateEventImage = async (id, imageUrl, publicId) => {
    try {
        const old = await Event.findById(id);
        if (old?.image) {
            const oldPublicId = old.imagePublicId; // ← guarda este campo en tu modelo
            if (oldPublicId) {
                await cloudinary.uploader.destroy(oldPublicId);
                console.log('🗑️  [Cloudinary] imagen anterior borrada:', oldPublicId);
            }
        }
        return await Event.findByIdAndUpdate(id, { image: imageUrl, imagePublicId: publicId }, // ← guarda ambos
        { new: true });
    }
    catch (err) {
        throw new Error('Error actualizando imagen del evento');
    }
};
export const deleteEventImage = async (id) => {
    try {
        const event = await Event.findById(id);
        if (event?.image) {
            const p = path.join(process.cwd(), event.image);
            if (fs.existsSync(p))
                fs.unlinkSync(p);
            event.image = undefined;
            await event.save();
        }
        return event;
    }
    catch {
        throw new Error('Error eliminando imagen del evento');
    }
};
export const deactivateExpiredEvents = async () => {
    try {
        const result = await Event.updateMany({ activo: true, desactivarEn: { $lte: new Date() } }, { $set: { activo: false } });
        if (result.modifiedCount > 0)
            console.log(`${result.modifiedCount} evento(s) desactivado(s) automáticamente`);
        return result.modifiedCount;
    }
    catch (error) {
        console.error('Error desactivando eventos expirados:', error);
        throw new Error('Error desactivando eventos expirados');
    }
};
export const confirmAssistence = async (usuarioId, eventoId, estadoAsistencia) => {
    const assistence = await EventInvitation.findOne({
        usuario: usuarioId,
        evento: eventoId,
        estadoInvitacion: "aceptada"
    });
    if (!assistence)
        throw new Error("Asistencia no encontrada");
    assistence.estadoAsistencia = estadoAsistencia;
    await assistence.save();
    return assistence;
};
