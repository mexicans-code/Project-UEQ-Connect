import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI no está definido en .env');
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB conectado:', mongoose.connection.host);
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
        process.exit(1);
    }
};

mongoose.connection.once('connected', () => {
    console.log(' MongoDB conectado exitosamente');
});

mongoose.connection.once('disconnected', () => {
    console.log('MongoDB desconectado');
});

mongoose.connection.on('error', (err: Error) => {
    console.error('Error en MongoDB:', err);
});

connectDB();

export default connectDB;