import { PersonalModel } from "./personal.model.js";
import axios from "axios";
export const findAllPersonal = async () => {
    try {
        const personal = await PersonalModel.find().sort({ nombre: 1 });
        return personal;
    }
    catch (error) {
        throw new Error('Error obteniendo personal');
    }
};
export const findPersonalById = async (id) => {
    try {
        const personal = await PersonalModel.findById(id);
        return personal;
    }
    catch (error) {
        throw new Error('Error obteniendo personal por ID');
    }
};
export const createPersonal = async (personalData) => {
    try {
        const personal = new PersonalModel(personalData);
        await personal.save();
        return personal;
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const fields = Object.keys(error.errors).join(', ');
            throw new Error(`Validación fallida en: ${fields} — ${error.message}`);
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || 'campo';
            throw new Error(`Ya existe un registro con ese ${field}`);
        }
        throw error; // ← propaga el error real
    }
};
export const updatePersonal = async (id, personalData) => {
    try {
        const personal = await PersonalModel.findByIdAndUpdate(id, personalData, { new: true, runValidators: true });
        return personal;
    }
    catch (error) {
        throw new Error('Error actualizando personal');
    }
};
export const deletePersonal = async (id) => {
    try {
        const personal = await PersonalModel.findByIdAndDelete(id);
        return personal;
    }
    catch (error) {
        throw new Error('Error eliminando personal');
    }
};
export const findPersonalByDepartamento = async (departamento) => {
    try {
        const personal = await PersonalModel.find({
            departamento: { $regex: departamento, $options: 'i' }
        }).sort({ nombre: 1 });
        return personal;
    }
    catch (error) {
        throw new Error('Error obteniendo personal por departamento');
    }
};
export const findPersonalByEstatus = async (estatus) => {
    try {
        const personal = await PersonalModel.find({ estatus }).sort({ nombre: 1 });
        return personal;
    }
    catch (error) {
        throw new Error('Error obteniendo personal por estatus');
    }
};
export const findPersonalByNombre = async (nombre) => {
    try {
        const personal = await PersonalModel.find({
            $or: [
                { nombre: { $regex: nombre, $options: 'i' } },
                { apellidoPaterno: { $regex: nombre, $options: 'i' } },
                { apellidoMaterno: { $regex: nombre, $options: 'i' } }
            ]
        }).sort({ nombre: 1 });
        return personal;
    }
    catch (error) {
        throw new Error('Error buscando personal por nombre');
    }
};
export const findPersonalByNumeroEmpleado = async (numeroEmpleado) => {
    try {
        const personal = await PersonalModel.findOne({ numeroEmpleado });
        return personal;
    }
    catch (error) {
        throw new Error('Error buscando personal por número de empleado');
    }
};
export const findPersonalConUbicacion = async (departamento) => {
    try {
        const personal = await PersonalModel.find({
            departamento: { $regex: departamento, $options: 'i' }
        }).sort({ nombre: 1 });
        if (personal.length === 0) {
            return {
                departamento,
                ubicacion: null,
                personal: []
            };
        }
        const LOCATIONS_API = process.env.LOCATIONS_API_URL || 'http://localhost:3000/api/locations';
        let ubicacionDepartamento = null;
        try {
            const response = await axios.get(LOCATIONS_API);
            const locations = response.data.data || response.data;
            ubicacionDepartamento = locations.find((loc) => loc.nombre.toLowerCase().includes(departamento.toLowerCase()));
        }
        catch (error) {
            console.error('Error obteniendo ubicaciones:', error);
        }
        return {
            departamento,
            ubicacion: ubicacionDepartamento ? {
                nombre: ubicacionDepartamento.nombre,
                coordenadas: ubicacionDepartamento.posicion,
                id: ubicacionDepartamento.id || ubicacionDepartamento._id
            } : null,
            personal: personal.map(p => ({
                numeroEmpleado: p.numeroEmpleado,
                nombreCompleto: `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`,
                email: p.email,
                telefono: p.telefono,
                cargo: p.cargo,
                cubiculo: p.cubiculo,
                planta: p.planta,
                estatus: p.estatus,
                imagenPerfil: p.imagenPerfil
            })),
            total: personal.length
        };
    }
    catch (error) {
        throw new Error('Error obteniendo personal con ubicación');
    }
};
export const findProfesorConUbicacion = async (numeroEmpleado) => {
    try {
        const profesor = await PersonalModel.findOne({ numeroEmpleado });
        if (!profesor) {
            return null;
        }
        const LOCATIONS_API = process.env.LOCATIONS_API_URL || 'http://localhost:3000/api/locations';
        let ubicacionDepartamento = null;
        try {
            const response = await axios.get(LOCATIONS_API);
            const locations = response.data.data || response.data;
            ubicacionDepartamento = locations.find((loc) => loc.nombre.toLowerCase().includes(profesor.departamento.toLowerCase()));
        }
        catch (error) {
            console.error('Error obteniendo ubicaciones:', error);
        }
        return {
            profesor: {
                numeroEmpleado: profesor.numeroEmpleado,
                nombreCompleto: `${profesor.nombre} ${profesor.apellidoPaterno} ${profesor.apellidoMaterno}`,
                email: profesor.email,
                telefono: profesor.telefono,
                departamento: profesor.departamento,
                cargo: profesor.cargo,
                cubiculo: profesor.cubiculo,
                planta: profesor.planta,
                fechaIngreso: profesor.fechaIngreso,
                estatus: profesor.estatus,
                imagenPerfil: profesor.imagenPerfil
            },
            ubicacion: ubicacionDepartamento ? {
                nombre: ubicacionDepartamento.nombre,
                coordenadas: ubicacionDepartamento.posicion,
                id: ubicacionDepartamento.id || ubicacionDepartamento._id,
                comoLlegar: `El profesor ${profesor.nombre} se encuentra en ${ubicacionDepartamento.nombre}, ${profesor.planta || 'planta no especificada'}, cubículo ${profesor.cubiculo || 'no especificado'}`
            } : null
        };
    }
    catch (error) {
        throw new Error('Error obteniendo información del profesor');
    }
};
export const buscarPersonal = async (termino) => {
    try {
        const personal = await PersonalModel.find({
            $or: [
                { nombre: { $regex: termino, $options: 'i' } },
                { apellidoPaterno: { $regex: termino, $options: 'i' } },
                { apellidoMaterno: { $regex: termino, $options: 'i' } },
                { email: { $regex: termino, $options: 'i' } },
                { numeroEmpleado: { $regex: termino, $options: 'i' } }
            ],
            estatus: 'activo'
        }).sort({ nombre: 1 }).limit(10);
        if (personal.length === 0) {
            return [];
        }
        const LOCATIONS_API = process.env.LOCATIONS_API_URL || 'http://localhost:3000/api/locations';
        let locations = [];
        try {
            const response = await axios.get(LOCATIONS_API);
            locations = response.data.data || response.data;
        }
        catch (error) {
            console.error('Error obteniendo ubicaciones:', error);
        }
        const resultados = personal.map(p => {
            const ubicacion = locations.find((loc) => loc.nombre.toLowerCase().includes(p.departamento.toLowerCase()));
            return {
                numeroEmpleado: p.numeroEmpleado,
                nombreCompleto: `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`,
                email: p.email,
                telefono: p.telefono,
                cargo: p.cargo,
                departamento: p.departamento,
                cubiculo: p.cubiculo,
                planta: p.planta,
                imagenPerfil: p.imagenPerfil,
                ubicacion: ubicacion ? {
                    nombre: ubicacion.nombre,
                    coordenadas: ubicacion.posicion
                } : null
            };
        });
        return resultados;
    }
    catch (error) {
        throw new Error('Error en búsqueda de personal');
    }
};
