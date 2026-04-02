import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../user/user.model.js';
import { registrarLog } from '../logs/log.service.js'; // 👈

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo';

export const register = async (req: Request, res: Response) => {
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

    const newUser = await User.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: password,
      rol: 'user',
      estatus: 'activo',
      fechaCreacion: new Date(),
    });

    await registrarLog({
      nivel: 'info',
      evento: 'Usuario registrado',
      metodo: req.method,
      ruta: req.originalUrl,
      statusCode: 201,
      ip: req.ip,
      userId: newUser._id.toString(),
      detalle: `Email: ${email}`,
    });

    const payload = {
      id: newUser._id.toString(),
      _id: newUser._id.toString(),
      email: newUser.email,
      rol: newUser.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' } as SignOptions);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          _id: newUser._id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol,
          estatus: newUser.estatus
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Este correo electrónico ya está registrado'
      });
    }
    res.status(500).json({ success: false, error: 'Error al registrar usuario' });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol } = req.body;

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

    const rolesPermitidos = ['user', 'admin', 'superadmin'];
    const rolFinal = rolesPermitidos.includes(rol) ? rol : 'user';

    if (req.user?.rol === 'admin' && rolFinal === 'superadmin') {
      await registrarLog({
        nivel: 'warn',
        evento: 'Intento de crear superadmin sin permisos',
        metodo: req.method,
        ruta: req.originalUrl,
        statusCode: 403,
        ip: req.ip,
        userId: req.user?._id?.toString(),
        detalle: `Email intento: ${email}`,
      });
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para crear superadministradores'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Este correo electrónico ya está registrado'
      });
    }

    const newUser = await User.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: password,
      rol: rolFinal,
      estatus: 'activo',
      fechaCreacion: new Date(),
      requiereCambioPassword: rolFinal === 'admin' || rolFinal === 'superadmin',
    });

    await registrarLog({
      nivel: 'info',
      evento: `Admin registrado - rol: ${rolFinal}`,
      metodo: req.method,
      ruta: req.originalUrl,
      statusCode: 201,
      ip: req.ip,
      userId: newUser._id.toString(),
      detalle: `Email: ${email}, creado por: ${req.user?._id}`,
    });

    const token = jwt.sign(
      { id: newUser._id.toString(), _id: newUser._id.toString(), email: newUser.email, rol: newUser.rol },
      JWT_SECRET,
      { expiresIn: '7d' } as SignOptions
    );

    res.status(201).json({
      success: true,
      message: `${rolFinal === 'superadmin' ? 'SuperAdmin' : rolFinal === 'admin' ? 'Admin' : 'Usuario'} registrado exitosamente`,
      data: {
        user: {
          _id: newUser._id,
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol,
          estatus: newUser.estatus
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Error en registro admin:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Este correo electrónico ya está registrado' });
    }
    res.status(500).json({ success: false, error: 'Error al registrar administrador' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      await registrarLog({
        nivel: 'warn',
        evento: 'Login fallido - usuario no existe',
        metodo: req.method,
        ruta: req.originalUrl,
        statusCode: 401,
        ip: req.ip,
        detalle: `Email: ${email}`,
      });
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    if (user.estatus !== 'activo') {
      await registrarLog({
        nivel: 'warn',
        evento: 'Login fallido - cuenta desactivada',
        metodo: req.method,
        ruta: req.originalUrl,
        statusCode: 403,
        ip: req.ip,
        userId: user._id.toString(),
        detalle: `Email: ${email}`,
      });
      return res.status(403).json({
        success: false,
        error: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await registrarLog({
        nivel: 'warn',
        evento: 'Login fallido - contraseña incorrecta',
        metodo: req.method,
        ruta: req.originalUrl,
        statusCode: 401,
        ip: req.ip,
        userId: user._id.toString(),
        detalle: `Email: ${email}`,
      });
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    await registrarLog({
      nivel: 'info',
      evento: 'Login exitoso',
      metodo: req.method,
      ruta: req.originalUrl,
      statusCode: 200,
      ip: req.ip,
      userId: user._id.toString(),
      detalle: `Email: ${email}`,
    });

    user.ultimoLogin = new Date();
    await user.save();

    const payload = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      rol: user.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' } as SignOptions);

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
          imagenPerfil: user.imagenPerfil || null,
          ultimoLogin: user.ultimoLogin,
          requiereCambioPassword: user.requiereCambioPassword ?? false,
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error al iniciar sesión' });
  }
};

export const biometricLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email es requerido' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      await registrarLog({
        nivel: 'warn',
        evento: 'Login biométrico fallido - usuario no existe',
        metodo: req.method,
        ruta: req.originalUrl,
        statusCode: 401,
        ip: req.ip,
        detalle: `Email: ${email}`,
      });
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (user.estatus !== 'activo') {
      await registrarLog({
        nivel: 'warn',
        evento: 'Login biométrico fallido - cuenta desactivada',
        metodo: req.method,
        ruta: req.originalUrl,
        statusCode: 403,
        ip: req.ip,
        userId: user._id.toString(),
        detalle: `Email: ${email}`,
      });
      return res.status(403).json({ success: false, error: 'Tu cuenta ha sido desactivada.' });
    }

    await registrarLog({
      nivel: 'info',
      evento: 'Login biométrico exitoso',
      metodo: req.method,
      ruta: req.originalUrl,
      statusCode: 200,
      ip: req.ip,
      userId: user._id.toString(),
      detalle: `Email: ${email}`,
    });

    const token = jwt.sign(
      { id: user._id.toString(), _id: user._id.toString(), email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '7d' } as SignOptions
    );

    res.json({
      success: true,
      message: 'Login biométrico exitoso',
      data: {
        user: { _id: user._id, nombre: user.nombre, email: user.email, rol: user.rol },
        token
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Error en login biométrico' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener usuario' });
  }
};