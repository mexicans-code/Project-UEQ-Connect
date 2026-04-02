import { Schema, model } from "mongoose";
const PersonalSchema = new Schema({
    numeroEmpleado: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    apellidoPaterno: { type: String, required: true },
    apellidoMaterno: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    imagenPerfil: {
        type: String,
        required: false,
        default: null
    },
    telefono: { type: String, required: true },
    departamento: { type: String, required: true },
    cargo: { type: String, required: true },
    cubiculo: { type: String, required: false },
    planta: { type: String, required: false },
    fechaIngreso: { type: Date, required: true },
    imagenHorario: {
        type: String,
        required: false,
        default: null
    },
    estatus: {
        type: String,
        enum: ["activo", "inactivo"],
        default: "activo"
    },
    rol: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
    },
    userId: {
        type: String,
        required: false,
        default: null,
        index: true,
    }
}, {
    timestamps: true,
    collection: 'personal'
});
export const PersonalModel = model("Personal", PersonalSchema, 'personal');
