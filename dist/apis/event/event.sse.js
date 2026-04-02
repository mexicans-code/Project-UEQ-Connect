import { io } from '../../index.js';
export const broadcastEventChange = (type, data) => {
    console.log(`🔔 Socket emit: ${type}`, data);
    io.emit(type, data);
};
