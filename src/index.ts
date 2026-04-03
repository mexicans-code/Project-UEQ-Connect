import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { register, collectDefaultMetrics } from 'prom-client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import connectDB from './database/MongoDB.js';
import locationRoutes from './apis/location/location.routes.js';
import eventRoutes from './apis/event/event.routes.js';
import userRoutes from './apis/user/user.routes.js';
import invitationRoutes from './apis/eventInvitation/eventInvitation.routes.js';
import personalRoutes from './apis/personal/personal.routes.js';
import authRoutes from "./apis/auth/auth.routes.js";
import espacioRoutes from "./apis/space/Espacio.routes.js";
import mostVisitedRoutes from "./apis/most_visited/most_visited.route.js";
import { deactivateExpiredEvents } from './apis/event/event.service.js';
import graphRoutes from './apis/rutas/graph_routes.js';
import { logMiddleware } from './apis/logs/log.middleware.js';
import logRoutes from './apis/logs/log.routes.js';

import path from 'path';
import fs from 'fs';
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

// Register default metrics
collectDefaultMetrics();


app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

export const io = new Server(httpServer, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // cada 1 minuto
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones, intenta más tarde.' }
});

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // cada 1 minuto
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de autenticación, espera 1 minuto.' }
});

const emailLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // cada 1 minuto
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados envíos de correo, espera 1 minuto.' }
});

const uploadsDestinos = path.join(process.cwd(), 'uploads', 'destinos');
const uploadsEvents = path.join(process.cwd(), 'uploads', 'events');

if (!fs.existsSync(uploadsDestinos)) {
    fs.mkdirSync(uploadsDestinos, { recursive: true });
    console.log('Carpeta uploads/destinos creada');
} else {
    console.log('Carpeta uploads/destinos ya existe');
}

if (!fs.existsSync(uploadsEvents)) {
    fs.mkdirSync(uploadsEvents, { recursive: true });
    console.log('Carpeta uploads/events creada');
} else {
    console.log('Carpeta uploads/events ya existe');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
console.log('Archivos estáticos configurados');


app.set('trust proxy', true);
app.use('/api/', generalLimiter);


connectDB();

setInterval(async () => {
    try {
        await deactivateExpiredEvents();
    } catch (error) {
        console.error('Error en tarea programada de desactivación:', error);
    }
}, 60000);

app.use(logMiddleware);

app.use("/api/espacios", espacioRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitaciones', invitationRoutes);
app.use('/api/personal', personalRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/most-visited", mostVisitedRoutes);
app.use('/api/grafo', graphRoutes);
app.use('/api/logs', logRoutes);

export { emailLimiter };

app.get('/', (req, res) => {
    res.json({ message: 'UTEQ Connect API v3 - Canary Saludooooooos :D' });
});

if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(` Servidor corriendo en http://localhost:${PORT}`);
        console.log(` Tarea de desactivación automática de eventos: ACTIVA`);
    });
}
export default app;