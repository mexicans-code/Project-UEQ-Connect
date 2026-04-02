import { Request, Response } from 'express';
import * as invitationService from './eventInvitation.service.js';

export const createInvitations = async (req: Request, res: Response) => {
  try {
    const eventoId = Array.isArray(req.params.eventoId) ? req.params.eventoId[0] : req.params.eventoId;
    const { userIds } = req.body; // Array opcional de IDs de usuarios

    const result = await invitationService.createInvitationsForEvent(eventoId, userIds);
    
    res.status(201).json({
      success: true,
      message: `${result.created.length} invitaciones creadas exitosamente`,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const invitation = await invitationService.findInvitationByToken(token);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitación no encontrada'
      });
    }

    res.json({
      success: true,
      data: invitation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const invitation = await invitationService.validateAndUseToken(token);

    res.json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: invitation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getEventInvitations = async (req: Request, res: Response) => {
  try {
    const eventoId = Array.isArray(req.params.eventoId) ? req.params.eventoId[0] : req.params.eventoId;
    const invitations = await invitationService.findInvitationsByEvent(eventoId);

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getEventStats = async (req: Request, res: Response) => {
  try {
    const eventoId = Array.isArray(req.params.eventoId) ? req.params.eventoId[0] : req.params.eventoId;
    const stats = await invitationService.getEventInvitationStats(eventoId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getUserInvitations = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const invitations = await invitationService.findInvitationsByUser(userId);

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const updateInvitationStatus = async (req: Request, res: Response) => {
  try {
    const invitationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { estadoInvitacion } = req.body;

    const invitation = await invitationService.updateInvitationStatus(invitationId, estadoInvitacion);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: invitation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const { token, respuesta } = req.body;

    if (!respuesta || (respuesta !== "aceptada" && respuesta !== "rechazada")) {
      return res.status(400).json({
        success: false,
        error: 'Respuesta inválida. Debe ser "aceptada" o "rechazada"'
      });
    }

    const invitation = await invitationService.respondToInvitationByToken(token, respuesta);

    res.json({
      success: true,
      message: `Invitación ${respuesta} exitosamente`,
      data: invitation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const registerToEvent = async (req: Request, res: Response) => {
  try {
    const eventoId = Array.isArray(req.params.eventoId) 
      ? req.params.eventoId[0] 
      : req.params.eventoId;

    // Obtener el ID del usuario autenticado desde el middleware de autenticación
    const userId = (req as any).user?.id || (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado. Debes iniciar sesión para registrarte a un evento.',
        requiresAuth: true
      });
    }

    // Crear la invitación (esto también valida el evento y los cupos)
    const invitation = await invitationService.createSingleInvitation(
      eventoId,
      userId
    );

    // Obtener la invitación con los datos completos
    const fullInvitation = await invitationService.findInvitationByToken(
      invitation.token
    );

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. Revisa tu correo para obtener tu boleto.',
      data: {
        invitation: fullInvitation,
        eventId: eventoId
      }
    });
  } catch (error) {
    console.error('Error en registro a evento:', error);
    
    // Manejar errores específicos
    if (error instanceof Error) {
      // Ya rechazó o invitación caducada
      if (error.message.includes('rechazaste') || error.message.includes('caducó')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      
      // No encontrado
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      // No hay cupos o no está activo
      if (error.message.includes('No hay cupos') || 
          error.message.includes('no está activo')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Error al registrarse al evento. Por favor intenta de nuevo.'
    });
  }
};

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const invitationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { asistio, estadoAsistencia } = req.body;

    // Soportar ambos formatos:
    //   { estadoAsistencia: "asistio" | "no_asistio" | "pendiente" }  ← frontend actual
    //   { asistio: true | false }                                      ← formato legacy
    let estadoFinal: string;
    if (estadoAsistencia !== undefined) {
      if (!['asistio', 'no_asistio', 'pendiente'].includes(estadoAsistencia)) {
        return res.status(400).json({
          success: false,
          error: 'estadoAsistencia inválido. Debe ser "asistio", "no_asistio" o "pendiente"'
        });
      }
      estadoFinal = estadoAsistencia;
    } else if (asistio !== undefined) {
      if (typeof asistio !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'El campo "asistio" debe ser un booleano'
        });
      }
      estadoFinal = asistio ? 'asistio' : 'no_asistio';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Se requiere "estadoAsistencia" o "asistio" en el body'
      });
    }

    const invitation = await invitationService.markAttendance(invitationId, estadoFinal);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Asistencia actualizada exitosamente',
      data: invitation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const regenerateQR = async (req: Request, res: Response) => {
  try {
    const invitationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const invitation = await invitationService.regenerateQRCode(invitationId);

    res.json({
      success: true,
      message: 'Código QR regenerado exitosamente',
      data: invitation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};


// PARA TENER LOS TICKETS DEL USUARIO

export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const invitations = await invitationService.findInvitationsByUser(userId.toString());

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};