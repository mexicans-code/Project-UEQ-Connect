import mongoose, { Schema } from "mongoose";
const DestinoSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    posicion: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    image: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'destinos'
});
export default mongoose.model('Destino', DestinoSchema);
