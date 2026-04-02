import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model.js';
/**
 * Registrar un nuevo usuario
 */
export const registerUser = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son obligatorios'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Este correo electrónico ya está registrado'
            });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await User.create({
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            rol: 'user',
            estatus: 'activo',
            fechaCreacion: new Date(),
        });
        const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo';
        const payload = {
            id: newUser._id.toString(),
            _id: newUser._id.toString(),
            email: newUser.email,
            rol: newUser.rol
        };
        const options = {
            expiresIn: '7d'
        };
        const token = jwt.sign(payload, JWT_SECRET, options);
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    _id: newUser._id,
                    nombre: newUser.nombre,
                    email: newUser.email,
                    rol: newUser.rol,
                    estatus: newUser.estatus,
                    imagenPerfil: newUser.imagenPerfil
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Este correo electrónico ya está registrado'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Error al registrar usuario'
        });
    }
};
/**
 * Login de usuario
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        if (user.estatus !== 'activo') {
            return res.status(403).json({
                success: false,
                error: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        user.ultimoLogin = new Date();
        await user.save();
        const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo';
        const payload = {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.email,
            rol: user.rol
        };
        const options = {
            expiresIn: '7d'
        };
        const token = jwt.sign(payload, JWT_SECRET, options);
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    _id: user._id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol,
                    estatus: user.estatus,
                    ultimoLogin: user.ultimoLogin,
                    imagenPerfil: user.imagenPerfil
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
};
/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil'
        });
    }
};
/**
 * Obtener todos los usuarios (solo admin)
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ fechaCreacion: -1 });
        res.json({
            success: true,
            data: users,
            total: users.length
        });
    }
    catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuarios'
        });
    }
};
/**
 * Obtener un usuario por ID
 */
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuario'
        });
    }
};
/**
 * Actualizar usuario
 */
export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { nombre, email, rol, estatus } = req.body;
        const updateData = {};
        if (nombre)
            updateData.nombre = nombre.trim();
        if (email)
            updateData.email = email.trim().toLowerCase();
        if (rol)
            updateData.rol = rol;
        if (estatus)
            updateData.estatus = estatus;
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: user
        });
    }
    catch (error) {
        console.error('Error actualizando usuario:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Este correo electrónico ya está en uso'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Error al actualizar usuario'
        });
    }
};
/**
 * Cambiar contraseña del usuario autenticado
 */
export const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña actual y nueva son requeridas'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }
        // passwordHash tiene select:false en el schema, hay que pedirlo explicitamente
        const user = await User.findById(userId).select('+passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        // Usar el metodo del modelo que ya maneja bcrypt correctamente
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Contrasena actual incorrecta'
            });
        }
        // Asignar texto plano: el pre-save hook del modelo hace el hash automaticamente
        user.passwordHash = newPassword;
        user.requiereCambioPassword = false;
        await user.save();
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    }
    catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar contraseña'
        });
    }
};
/**
 * Desactivar usuario (soft delete)
 */
export const deactivateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndUpdate(userId, { estatus: 'inactivo' }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Usuario desactivado exitosamente',
            data: user
        });
    }
    catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al desactivar usuario'
        });
    }
};
/**
 * Activar usuario
 */
export const activateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndUpdate(userId, { estatus: 'activo' }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Usuario activado exitosamente',
            data: user
        });
    }
    catch (error) {
        console.error('Error activando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al activar usuario'
        });
    }
};
/**
 * Eliminar usuario permanentemente (solo superadmin)
 */
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Usuario eliminado permanentemente'
        });
    }
    catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar usuario'
        });
    }
};
/**
 * Actualizar imagen de perfil del usuario autenticado
 */
export const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { imagenPerfil } = req.body;
        if (!imagenPerfil) {
            return res.status(400).json({
                success: false,
                error: 'URL de imagen es requerida'
            });
        }
        const user = await User.findByIdAndUpdate(userId, { imagenPerfil }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Imagen de perfil actualizada exitosamente',
            data: user
        });
    }
    catch (error) {
        console.error('Error actualizando imagen de perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar imagen de perfil'
        });
    }
};
/**
 * Eliminar imagen de perfil del usuario autenticado
 */
export const deleteProfileImage = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const user = await User.findByIdAndUpdate(userId, { imagenPerfil: null }, { new: true }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Imagen de perfil eliminada exitosamente',
            data: user
        });
    }
    catch (error) {
        console.error('Error eliminando imagen de perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar imagen de perfil'
        });
    }
};
