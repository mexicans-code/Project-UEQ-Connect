import { io } from '../../index.js';

export const broadcastEventChange = (
    type: 'event_created' | 'event_updated' | 'event_deleted',
    data: object
) => {
    console.log(`🔔 Socket emit: ${type}`, data);
    io.emit(type, data);
};