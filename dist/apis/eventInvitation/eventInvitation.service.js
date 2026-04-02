import EventInvitation from './eventInvitation.model.js';
import Evento from '../event/event.model.js';
import User from '../user/user.model.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
const generateQRCode = async (token) => {
    try {
        const qrCodeData = await QRCode.toDataURL(token, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
        });
        return qrCodeData;
    }
    catch (error) {
        console.error('Error generando QR code:', error);
        throw new Error('No se pudo generar el código QR');
    }
};
export const createSingleInvitation = async (eventoId, userId) => {
    const user = await User.findById(userId);
    if (!user)
        throw new Error('Usuario no encontrado');
    const existingInvitation = await EventInvitation.findOne({ evento: eventoId, usuario: userId });
    if (existingInvitation) {
        // Ya inscrito y aceptado → devolver la existente sin cambios
        if (existingInvitation.estadoInvitacion === 'aceptada')
            return existingInvitation;
        // Rechazada por el admin → el usuario puede reintentar.
        // Se reutiliza el mismo documento (el índice único evento+usuario lo impide crear otro)
        // y se pone en 'enviada' para que el admin lo revise. NO se resta cupo todavía.
        if (existingInvitation.estadoInvitacion === 'rechazada') {
            existingInvitation.estadoInvitacion = 'enviada';
            existingInvitation.estadoAsistencia = 'pendiente';
            existingInvitation.fechaEnvio = new Date();
            existingInvitation.fechaRespuesta = undefined;
            await existingInvitation.save();
            return existingInvitation;
        }
        // Invitación caducada → no puede reinscribirse, debe contactar al organizador
        if (existingInvitation.estadoInvitacion === 'caducada') {
            throw new Error('Tu invitación anterior caducó. Contacta al organizador.');
        }
        // Ya existe en estado 'enviada' (pendiente de revisión) → devolver sin duplicar
        return existingInvitation;
    }
    const evento = await Evento.findById(eventoId);
    if (!evento || !evento.activo)
        throw new Error('Evento no encontrado o no activo');
    const acceptedCount = await EventInvitation.countDocuments({ evento: eventoId, estadoInvitacion: 'aceptada' });
    if (acceptedCount >= evento.cupos)
        throw new Error('No hay cupos disponibles para este evento');
    try {
        const token = generateToken();
        const qrCode = await generateQRCode(token);
        const invitation = await EventInvitation.create({
            evento: eventoId,
            usuario: userId,
            token,
            qrCode,
            estadoInvitacion: 'aceptada',
            estadoAsistencia: 'pendiente',
            fechaEnvio: new Date(),
            fechaRespuesta: new Date(),
            emailEnviado: false,
        });
        // Recalcular cupos tras la nueva inscripción aceptada
        const newAcceptedCount = await EventInvitation.countDocuments({ evento: eventoId, estadoInvitacion: 'aceptada' });
        const newCuposDisponibles = Math.max(0, evento.cupos - newAcceptedCount);
        await Evento.findByIdAndUpdate(eventoId, { cuposDisponibles: newCuposDisponibles });
        return invitation;
    }
    catch (error) {
        throw error;
    }
};
export const createInvitationsForEvent = async (eventoId, userIds) => {
    const evento = await Evento.findById(eventoId);
    if (!evento)
        throw new Error('Evento no encontrado');
    let users;
    if (userIds && userIds.length > 0) {
        users = await User.find({ _id: { $in: userIds } });
    }
    else {
        users = await User.find({ activo: true });
    }
    const results = { created: [], existing: [], failed: [] };
    for (const user of users) {
        try {
            const existingInvitation = await EventInvitation.findOne({ evento: eventoId, usuario: user._id });
            if (existingInvitation) {
                results.existing.push({ userId: user._id, email: user.email, invitationId: existingInvitation._id });
                continue;
            }
            const token = generateToken();
            const qrCode = await generateQRCode(token);
            const invitation = await EventInvitation.create({
                evento: eventoId,
                usuario: user._id,
                token,
                qrCode,
                estadoInvitacion: 'enviada',
                estadoAsistencia: 'pendiente',
                fechaEnvio: new Date(),
            });
            results.created.push({ userId: user._id, email: user.email, invitationId: invitation._id });
        }
        catch (error) {
            results.failed.push({ userId: user._id, email: user.email, error: error instanceof Error ? error.message : 'Error desconocido' });
        }
    }
    return results;
};
export const findInvitationByToken = async (token) => {
    return await EventInvitation.findOne({ token })
        .populate('evento')
        .populate('usuario', 'nombre email imagenPerfil');
};
export const validateAndUseToken = async (token) => {
    const invitation = await EventInvitation.findOne({ token }).populate('evento');
    if (!invitation)
        throw new Error('Token inválido');
    if (invitation.estadoInvitacion !== 'aceptada')
        throw new Error('La invitación no ha sido aceptada');
    if (invitation.estadoAsistencia === 'asistio')
        throw new Error('Este token ya fue utilizado');
    const evento = invitation.evento;
    const eventDate = new Date(evento.fechaInicio);
    const now = new Date();
    if (eventDate < now && now.getTime() - eventDate.getTime() > 24 * 60 * 60 * 1000)
        throw new Error('El evento ya finalizó');
    invitation.estadoAsistencia = 'asistio';
    invitation.fechaUsoToken = new Date();
    invitation.intentosUso += 1;
    await invitation.save();
    return invitation;
};
export const findInvitationsByEvent = async (eventoId) => {
    return await EventInvitation.find({ evento: eventoId })
        .populate('usuario', 'nombre email imagenPerfil')
        .sort({ fechaEnvio: -1 });
};
export const findInvitationsByUser = async (userId) => {
    return await EventInvitation.find({ usuario: userId })
        .populate('evento')
        .sort({ fechaEnvio: -1 });
};
export const getEventInvitationStats = async (eventoId) => {
    const invitations = await EventInvitation.find({ evento: eventoId });
    return {
        total: invitations.length,
        enviadas: invitations.filter((i) => i.estadoInvitacion === 'enviada').length,
        aceptadas: invitations.filter((i) => i.estadoInvitacion === 'aceptada').length,
        rechazadas: invitations.filter((i) => i.estadoInvitacion === 'rechazada').length,
        caducadas: invitations.filter((i) => i.estadoInvitacion === 'caducada').length,
        asistencias: invitations.filter((i) => i.estadoAsistencia === 'asistio').length,
        pendientes: invitations.filter((i) => i.estadoAsistencia === 'pendiente').length,
        noAsistio: invitations.filter((i) => i.estadoAsistencia === 'no_asistio').length,
    };
};
export const updateInvitationStatus = async (invitationId, estadoInvitacion) => {
    const invitation = await EventInvitation.findById(invitationId);
    if (!invitation)
        return null;
    const previousEstado = invitation.estadoInvitacion;
    // Guardar el nuevo estado PRIMERO
    invitation.estadoInvitacion = estadoInvitacion;
    invitation.fechaRespuesta = new Date();
    await invitation.save();
    // Recalcular cuposDisponibles DESPUÉS de que el nuevo estado ya está persistido
    if (previousEstado !== estadoInvitacion) {
        const evento = await Evento.findById(invitation.evento);
        if (evento) {
            const acceptedCount = await EventInvitation.countDocuments({ evento: invitation.evento, estadoInvitacion: 'aceptada' });
            const newCuposDisponibles = Math.max(0, evento.cupos - acceptedCount);
            await Evento.findByIdAndUpdate(invitation.evento, { cuposDisponibles: newCuposDisponibles });
        }
    }
    return invitation;
};
export const respondToInvitationByToken = async (token, respuesta) => {
    const invitation = await EventInvitation.findOne({ token });
    if (!invitation)
        throw new Error('Invitación no encontrada');
    if (invitation.estadoInvitacion !== 'enviada')
        throw new Error('Esta invitación ya fue respondida');
    invitation.estadoInvitacion = respuesta;
    invitation.fechaRespuesta = new Date();
    await invitation.save();
    const acceptedCount = await EventInvitation.countDocuments({ evento: invitation.evento, estadoInvitacion: 'aceptada' });
    const evento = await Evento.findById(invitation.evento);
    if (evento) {
        const newCuposDisponibles = Math.max(0, evento.cupos - acceptedCount);
        await Evento.findByIdAndUpdate(invitation.evento, { cuposDisponibles: newCuposDisponibles });
    }
    return invitation;
};
/**
 * Marca asistencia manualmente
 */
export const markAttendance = async (invitationId, estadoAsistencia) => {
    const invitation = await EventInvitation.findById(invitationId);
    if (!invitation)
        return null;
    if (estadoAsistencia === 'asistio' || estadoAsistencia === 'no_asistio' || estadoAsistencia === 'pendiente') {
        invitation.estadoAsistencia = estadoAsistencia;
    }
    else {
        invitation.estadoAsistencia = 'no_asistio';
    }
    if (invitation.estadoAsistencia === 'asistio' && !invitation.fechaUsoToken) {
        invitation.fechaUsoToken = new Date();
    }
    await invitation.save();
    return invitation;
};
export const regenerateQRCode = async (invitationId) => {
    const invitation = await EventInvitation.findById(invitationId);
    if (!invitation)
        throw new Error('Invitación no encontrada');
    const newToken = generateToken();
    const newQRCode = await generateQRCode(newToken);
    invitation.token = newToken;
    invitation.qrCode = newQRCode;
    await invitation.save();
    return invitation;
};
