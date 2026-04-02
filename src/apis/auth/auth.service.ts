import User from '../user/user.model.js';
import bcrypt from 'bcryptjs';

export const loginUser = async (email: string, password: string) => {
  try {
    // Buscar el usuario por email (incluir el passwordHash esta vez)
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error('Email o contraseña incorrectos');
    }

    // Verificar si el usuario está activo
    if (user.estatus !== 'activo') {
      throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Email o contraseña incorrectos');
    }

    // Actualizar último login
    user.ultimoLogin = new Date();
    await user.save();

    // Retornar el usuario sin el password
    const userObj = user.toObject();
    const { passwordHash, ...userWithoutPassword } = userObj;

    return {
      user: userWithoutPassword
    };
  } catch (error) {
    throw error;
  }
};