import mongoose, { Schema, Document } from 'mongoose';

export interface IGraphNode extends Document {
  nodeId:    string;
  lat:       number;
  lng:       number;
  label?:    string;
  destinoId: string | null;
  tipo:      'destino' | 'interseccion' | 'auxiliar';
}

const GraphNodeSchema = new Schema<IGraphNode>({
  nodeId:    { type: String, required: true, unique: true },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  label:     { type: String },
  destinoId: { type: String, default: null },
  tipo:      { type: String, enum: ['destino', 'interseccion', 'auxiliar'], default: 'destino' },
}, { timestamps: true, collection: 'graph_nodes' });

export interface IGraphEdge extends Document {
  from:      string;
  to:        string;
  distance:  number;
  // Puntos intermedios del camino físico trazado en My Maps
  waypoints: { lat: number; lng: number }[];
}

const GraphEdgeSchema = new Schema<IGraphEdge>({
  from:     { type: String, required: true },
  to:       { type: String, required: true },
  distance: { type: Number, required: true },
  waypoints: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  }],
}, { timestamps: true, collection: 'graph_edges' });

GraphEdgeSchema.index({ from: 1 });

export const GraphNode = mongoose.model<IGraphNode>('GraphNode', GraphNodeSchema);
export const GraphEdge = mongoose.model<IGraphEdge>('GraphEdge', GraphEdgeSchema);