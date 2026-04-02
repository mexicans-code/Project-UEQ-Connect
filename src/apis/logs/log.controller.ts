import { Request, Response } from 'express';
import Log from './log.model.js';

export const getLogs = async (req: Request, res: Response) => {
    try {
        const logs = await Log.find().sort({ fecha: -1 }).limit(200);
        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo logs' });
    }
};