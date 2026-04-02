import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  titulo: string;
  descripcion?: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  destino: mongoose.Types.ObjectId;
  espacio: mongoose.Types.ObjectId;
  cupos: number;
  cuposDisponibles: number;
  creadoPor?: mongoose.Types.ObjectId;
  activo: boolean;
  desactivarEn?: Date;
  image?: string;
  imagePublicId?: string;
}

const EventSchema = new Schema<IEvent>({
  titulo: {
    type: String,
    required: [true, "El título es requerido"],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  fecha: {
    type: Date,
    required: [true, "La fecha es requerida"]
  },
  horaInicio: {
    type: String,
    required: [true, "La hora de inicio es requerida"]
  },
  horaFin: {
    type: String,
    required: [true, "La hora de fin es requerida"]
  },
  destino: {
    type: Schema.Types.ObjectId,
    ref: "Destino",
    required: [true, "El destino es requerido"]
  },
  espacio: {
    type: Schema.Types.ObjectId,
    ref: "Espacio",
    required: false,
    default: null
  },
  cupos: {
    type: Number,
    required: [true, "Los cupos son requeridos"],
    min: [1, "Debe haber al menos 1 cupo"]
  },
  cuposDisponibles: {
    type: Number,
    required: [true, "Los cupos disponibles son requeridos"],
    min: [0, "Los cupos disponibles no pueden ser negativos"]
  },
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  activo: {
    type: Boolean,
    default: true
  },
  desactivarEn: {
    type: Date
  },
  image: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'events'
});

export default mongoose.model<IEvent>("Evento", EventSchema);
