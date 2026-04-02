import { Request, Response, NextFunction } from 'express';
import { registrarLog } from './log.service.js';

export const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json.bind(res);

    res.json = (body: any) => {
        const statusCode = res.statusCode;
        const ip = req.ip || req.socket.remoteAddress || 'desconocida';
        const userId = (req as any).user?._id?.toString();
        const ruta = req.originalUrl;
        const metodo = req.method;

        // 401 / 403 — acceso no autorizado
        if (statusCode === 401 || statusCode === 403) {
            registrarLog({
                nivel: 'warn',
                evento: statusCode === 401 ? 'Acceso no autorizado' : 'Acceso prohibido',
                metodo,
                ruta,
                statusCode,
                ip,
                userId,
                detalle: body?.error || '',
            });
        }

        // 500 — error del servidor
        if (statusCode >= 500) {
            registrarLog({
                nivel: 'error',
                evento: 'Error interno del servidor',
                metodo,
                ruta,
                statusCode,
                ip,
                userId,
                detalle: body?.error || '',
            });
        }

        // Creación de eventos
        if (metodo === 'POST' && ruta.includes('/api/events') && statusCode === 201) {
            registrarLog({
                nivel: 'info',
                evento: 'Evento creado',
                metodo,
                ruta,
                statusCode,
                ip,
                userId,
                detalle: `ID: ${body?.data?._id}`,
            });
        }

        // Eliminación de recursos
        if (metodo === 'DELETE' && statusCode === 200) {
            registrarLog({
                nivel: 'warn',
                evento: 'Recurso eliminado',
                metodo,
                ruta,
                statusCode,
                ip,
                userId,
            });
        }

        return originalSend(body);
    };

    next();
};