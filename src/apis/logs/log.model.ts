import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
    nivel: 'info' | 'warn' | 'error';
    evento: string;
    metodo: string;
    ruta: string;
    statusCode: number;
    ip: string;
    userId?: string;
    detalle?: string;
    fecha: Date;
}

const LogSchema = new Schema<ILog>({
    nivel: { type: String, enum: ['info', 'warn', 'error'], required: true },
    evento: { type: String, required: true },
    metodo: { type: String },
    ruta: { type: String },
    statusCode: { type: Number },
    ip: { type: String },
    userId: { type: String },
    detalle: { type: String },
    fecha: { type: Date, default: Date.now },
});

export default mongoose.model<ILog>('Log', LogSchema);