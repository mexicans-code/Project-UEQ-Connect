import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        _id: string;
        email: string;
        rol?: 'superadmin' | 'admin' | 'user';
        [key: string]: any;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación no proporcionado',
        requiresAuth: true
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo';

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expirado. Por favor inicia sesión nuevamente',
            requiresAuth: true,
            expired: true
          });
        }

        return res.status(403).json({
          success: false,
          error: 'Token inválido',
          requiresAuth: true
        });
      }

      req.user = {
        id: decoded.id || decoded._id,
        _id: decoded._id || decoded.id,
        email: decoded.email,
        rol: decoded.rol,
        ...decoded
      };

      next();
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor de autenticación'
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        requiresAuth: true
      });
    }

    const userRole = req.user.rol;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      requiresAuth: true
    });
  }

  // Permitir tanto admin como superadmin
  if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Se requieren permisos de administrador'
    });
  }

  next();
};

export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        requiresAuth: true
      });
    }

    const requestedUserId = req.params[userIdParam] || req.body[userIdParam];
    const authenticatedUserId = req.user.id || req.user._id;

    // Permitir si es admin o superadmin
    if (req.user.rol === 'admin' || req.user.rol === 'superadmin') {
      return next();
    }

    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        error: 'No puedes acceder a recursos de otros usuarios'
      });
    }

    next();
  };
};