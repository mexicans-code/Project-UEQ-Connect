import Log from './log.model.js';
export const registrarLog = async (data) => {
    try {
        await Log.create(data);
    }
    catch (error) {
        console.error('Error guardando log:', error);
    }
};
