import mongoose, { Schema } from 'mongoose';
const LogSchema = new Schema({
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
export default mongoose.model('Log', LogSchema);
