import Destino from './location.model.js';
import Espacio from '../space/Espacio.model.js';
import fs from 'fs';
import path from 'path';
const attachEspacios = async (destinos) => {
    if (destinos.length === 0)
        return destinos;
    const ids = destinos.map(d => (d._id ?? d.id).toString());
    const espacios = await Espacio.find({ destino: { $in: ids } }).lean();
    return destinos.map(d => {
        const plain = d.toObject ? d.toObject() : { ...d };
        plain.espacios = espacios.filter(e => e.destino.toString() === (plain._id ?? plain.id).toString());
        return plain;
    });
};
export const findAllDestinos = async () => {
    try {
        const destinos = await Destino.find();
        return await attachEspacios(destinos);
    }
    catch (error) {
        throw new Error('Error obteniendo destinos');
    }
};
export const findDestinoById = async (id) => {
    try {
        const destino = await Destino.findById(id);
        if (!destino)
            return null;
        const [result] = await attachEspacios([destino]);
        return result;
    }
    catch (error) {
        throw new Error('Error obteniendo destino');
    }
};
export const createDestino = async (data) => {
    try {
        const destino = new Destino(data);
        await destino.save();
        return destino;
    }
    catch (error) {
        throw new Error('Error creando destino');
    }
};
export const updateDestino = async (id, data) => {
    try {
        return await Destino.findByIdAndUpdate(id, data, { new: true });
    }
    catch (error) {
        throw new Error('Error actualizando destino');
    }
};
export const deleteDestino = async (id) => {
    try {
        const destino = await Destino.findById(id);
        if (destino?.image) {
            const imagePath = path.join(process.cwd(), destino.image);
            if (fs.existsSync(imagePath))
                fs.unlinkSync(imagePath);
        }
        await Destino.findByIdAndDelete(id);
        return destino;
    }
    catch (error) {
        throw new Error('Error eliminando destino');
    }
};
export const updateDestinoImage = async (id, imagePath) => {
    try {
        const oldDestino = await Destino.findById(id);
        if (oldDestino?.image) {
            const oldPath = path.join(process.cwd(), oldDestino.image);
            if (fs.existsSync(oldPath))
                fs.unlinkSync(oldPath);
        }
        return await Destino.findByIdAndUpdate(id, { image: imagePath }, { new: true });
    }
    catch (error) {
        throw new Error('Error actualizando imagen del destino');
    }
};
export const deleteDestinoImage = async (id) => {
    try {
        const destino = await Destino.findById(id);
        if (destino?.image) {
            const imgPath = path.join(process.cwd(), destino.image);
            if (fs.existsSync(imgPath))
                fs.unlinkSync(imgPath);
            destino.image = undefined;
            await destino.save();
        }
        return destino;
    }
    catch (error) {
        throw new Error('Error eliminando imagen del destino');
    }
};
