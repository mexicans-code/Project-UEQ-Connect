import mongoose, { Schema } from 'mongoose';
const GraphNodeSchema = new Schema({
    nodeId: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String },
    destinoId: { type: String, default: null },
    tipo: { type: String, enum: ['destino', 'interseccion', 'auxiliar'], default: 'destino' },
}, { timestamps: true, collection: 'graph_nodes' });
const GraphEdgeSchema = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    distance: { type: Number, required: true },
    waypoints: [{
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        }],
}, { timestamps: true, collection: 'graph_edges' });
GraphEdgeSchema.index({ from: 1 });
export const GraphNode = mongoose.model('GraphNode', GraphNodeSchema);
export const GraphEdge = mongoose.model('GraphEdge', GraphEdgeSchema);
