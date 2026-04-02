import { findAllPersonal, findPersonalById, createPersonal, updatePersonal, deletePersonal, findPersonalByDepartamento, findPersonalByEstatus, findPersonalConUbicacion, findProfesorConUbicacion, buscarPersonal } from './personal.service.js';
import { PersonalModel } from './personal.model.js';
export const getAllPersonal = async (req, res) => {
    try {
        const personal = await findAllPersonal();
        res.status(200).json({
            success: true,
            count: personal.length,
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personal',
            error: error.message
        });
    }
};
export const getPersonalById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        const personal = await findPersonalById(id);
        if (!personal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personal',
            error: error.message
        });
    }
};
export const createNewPersonal = async (req, res) => {
    try {
        const personalData = req.body;
        const newPersonal = await createPersonal(personalData);
        res.status(201).json({
            success: true,
            message: 'Personal creado exitosamente',
            data: newPersonal
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear personal',
            error: error.message
        });
    }
};
export const updatePersonalById = async (req, res) => {
    try {
        console.log('🔴 UPDATE id:', req.params.id);
        console.log('📦 Body completo:', JSON.stringify(req.body, null, 2));
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        const personalData = req.body;
        const updatedPersonal = await updatePersonal(id, personalData);
        if (!updatedPersonal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Personal actualizado exitosamente',
            data: updatedPersonal
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar personal',
            error: error.message
        });
    }
};
export const deletePersonalById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        const deletedPersonal = await deletePersonal(id);
        if (!deletedPersonal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Personal eliminado exitosamente',
            data: deletedPersonal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar personal',
            error: error.message
        });
    }
};
export const getPersonalByDepartamento = async (req, res) => {
    try {
        const { departamento } = req.params;
        if (typeof departamento !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Departamento inválido'
            });
        }
        const personal = await findPersonalByDepartamento(departamento);
        res.status(200).json({
            success: true,
            count: personal.length,
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personal por departamento',
            error: error.message
        });
    }
};
export const getPersonalByEstatus = async (req, res) => {
    try {
        const { estatus } = req.params;
        if (typeof estatus !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Estatus inválido'
            });
        }
        const personal = await findPersonalByEstatus(estatus);
        res.status(200).json({
            success: true,
            count: personal.length,
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personal por estatus',
            error: error.message
        });
    }
};
export const getPersonalConUbicacion = async (req, res) => {
    try {
        const { departamento } = req.params;
        if (typeof departamento !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Departamento inválido'
            });
        }
        const resultado = await findPersonalConUbicacion(departamento);
        res.status(200).json({
            success: true,
            data: resultado
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personal con ubicación',
            error: error.message
        });
    }
};
export const getProfesorConUbicacion = async (req, res) => {
    try {
        const { numeroEmpleado } = req.params;
        if (typeof numeroEmpleado !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Número de empleado inválido'
            });
        }
        const resultado = await findProfesorConUbicacion(numeroEmpleado);
        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Profesor no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data: resultado
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del profesor',
            error: error.message
        });
    }
};
export const searchPersonal = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Término de búsqueda requerido'
            });
        }
        const resultados = await buscarPersonal(q.trim());
        res.status(200).json({
            success: true,
            count: resultados.length,
            data: resultados
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en la búsqueda',
            error: error.message
        });
    }
};
export const updatePersonalProfileImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha proporcionado ninguna imagen'
            });
        }
        const imageUrl = req.file.path; // URL completa de Cloudinary
        const personal = await PersonalModel.findByIdAndUpdate(id, { imagenPerfil: imageUrl }, { new: true });
        if (!personal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Imagen de perfil actualizada exitosamente',
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar imagen de perfil',
            error: error.message
        });
    }
};
export const deletePersonalProfileImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        const personal = await PersonalModel.findByIdAndUpdate(id, { imagenPerfil: null }, { new: true });
        if (!personal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Imagen de perfil eliminada exitosamente',
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar imagen de perfil',
            error: error.message
        });
    }
};
export const updatePersonalScheduleImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha proporcionado ninguna imagen'
            });
        }
        const imageUrl = req.file.path; // URL completa de Cloudinary
        const personal = await PersonalModel.findByIdAndUpdate(id, { imagenHorario: imageUrl }, { new: true });
        if (!personal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Imagen de horario actualizada exitosamente',
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar imagen de horario',
            error: error.message
        });
    }
};
export const deletePersonalScheduleImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        const personal = await PersonalModel.findByIdAndUpdate(id, { imagenHorario: null }, { new: true });
        if (!personal) {
            return res.status(404).json({
                success: false,
                message: 'Personal no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Imagen de horario eliminada exitosamente',
            data: personal
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar imagen de horario',
            error: error.message
        });
    }
};
