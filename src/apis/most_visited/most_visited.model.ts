import mongoose, { Schema, Document } from "mongoose";

export interface IMostVisited extends Document {
    _id: mongoose.Types.ObjectId;
    rank: number;
    nombre: string;
    count: number;
    actualizado_en: Date;
}

const MostVisitedSchema = new Schema<IMostVisited>({
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

export default mongoose.model<IMostVisited>('top5_lugares', MostVisitedSchema);
