import User from './user.model.js';
import bcrypt from "bcryptjs";

export const findAllUsers = async () => {
  try {
    const users = await User.find().select('-passwordHash');
    return users;
  } catch (error) {
    throw new Error('Error obteniendo usuarios');
  }
};

export const findUserById = async (id: string) => {
  try {
    const user = await User.findById(id).select('-passwordHash');
    return user;
  } catch (error) {
    throw new Error('Error obteniendo usuario');
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw new Error('Error obteniendo usuario por email');
  }
};

export const createUser = async (userData: any) => {
  try {
    if (!userData.password) {
      throw new Error('La contraseña es requerida');
    }

    if (!userData.nombre) {
      throw new Error('El nombre es requerido');
    }

    if (!userData.email) {
      throw new Error('El email es requerido');
    }

    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new User({
      nombre: userData.nombre.trim(),
      email: userData.email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      imagenPerfil: userData.imagenPerfil || null,
      rol: userData.rol || 'user',
      estatus: userData.estatus || 'activo'
    });

    await user.save();

    const userObj = user.toObject();
    const { passwordHash, ...userWithoutPassword } = userObj;

    return userWithoutPassword;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new Error('El email ya está registrado');
    }
    throw error;
  }
};

export const updateUser = async (id: string, userData: any) => {
  try {
    if (userData.password) {
      userData.passwordHash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      userData,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    return user;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const user = await User.findByIdAndDelete(id).select('-passwordHash');
    return user;
  } catch (error) {
    throw new Error('Error eliminando usuario');
  }
};

export const updateUltimoLogin = async (id: string) => {
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { ultimoLogin: new Date() },
      { new: true }
    ).select('-passwordHash');
    return user;
  } catch (error) {
    throw new Error('Error actualizando último login');
  }
};

export const changeUserStatus = async (id: string, estatus: "activo" | "inactivo") => {
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { estatus },
      { new: true }
    ).select('-passwordHash');
    return user;
  } catch (error) {
    throw new Error('Error cambiando estatus de usuario');
  }
};

export const findUsersByRol = async (rol: string) => {
  try {
    const users = await User.find({ rol }).select('-passwordHash');
    return users;
  } catch (error) {
    throw new Error('Error obteniendo usuarios por rol');
  }
};

export const findActiveUsers = async () => {
  try {
    const users = await User.find({ estatus: "activo" }).select('-passwordHash');
    return users;
  } catch (error) {
    throw new Error('Error obteniendo usuarios activos');
  }
};