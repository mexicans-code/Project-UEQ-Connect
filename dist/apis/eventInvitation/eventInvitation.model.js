import mongoose, { Schema } from "mongoose";
const EventInvitationSchema = new Schema({
    evento: {
        type: Schema.Types.ObjectId,
        ref: "Evento",
        required: true
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    qrCode: {
        type: String // Guardamos el QR en base64 o URL
    },
    estadoInvitacion: {
        type: String,
        enum: ["enviada", "aceptada", "rechazada", "caducada"],
        default: "enviada"
    },
    estadoAsistencia: {
        type: String,
        enum: ["pendiente", "asistio", "no_asistio"],
        default: "pendiente"
    },
    fechaEnvio: {
        type: Date,
        default: Date.now
    },
    fechaRespuesta: {
        type: Date
    },
    fechaUsoToken: {
        type: Date
    },
    emailEnviado: {
        type: Boolean,
        default: false
    },
    intentosUso: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'event_invitations'
});
// Índice compuesto para búsquedas rápidas y evitar duplicados
EventInvitationSchema.index({ evento: 1, usuario: 1 }, { unique: true });
export default mongoose.model("EventInvitation", EventInvitationSchema);
