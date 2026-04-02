import mongoose, { Schema } from "mongoose";
const MostVisitedSchema = new Schema({
    _id: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    rank: {
        type: Number,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    actualizado_en: {
        type: Date,
        required: true
    }
});
export default mongoose.model('top5_lugares', MostVisitedSchema);
