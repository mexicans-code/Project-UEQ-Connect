import mongoose, { Schema, Document } from "mongoose";

export interface IEspacio extends Document {
    nombre: string;
    destino: mongoose.Types.ObjectId;
    cupos: number;
    ocupado: boolean;
    planta: "Planta baja" | "Planta alta" | "Planta única";
    descripcion?: string;
    image?: string;
}

const EspacioSchema = new Schema<IEspacio>({
    nombre: {
        type: String,
        required: [true, "El nombre es requerido"],
        trim: true
    },
    destino: {
        type: Schema.Types.ObjectId,
        ref: "Destino",
        required: [true, "El destino es requerido"]
    },
    cupos: {
        type: Number,
        required: [true, "Los cupos son requeridos"],
        min: [1, "Debe haber al menos 1 cupo"]
    },
    ocupado: {
        type: Boolean,
        default: false
    },
    planta: {
        type: String,
        enum: ["Planta baja", "Planta alta", "Planta única"],
        required: [true, "La planta es requerida"]
    },
    descripcion: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: "espacios"
});

export default mongoose.model<IEspacio>("Espacio", EspacioSchema);