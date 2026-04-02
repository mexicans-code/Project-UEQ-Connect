import mongoose, { Schema, Document } from "mongoose";
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  nombre: string;
  email: string;
  passwordHash: string;
  imagenPerfil?: string;
  rol: "superadmin" | "admin" | "user";
  estatus: "activo" | "inactivo";
  fechaCreacion: Date;
  ultimoLogin?: Date;
  requiereCambioPassword?: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  nombre: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: { 
    type: String, 
    required: true,
    select: false
  },
  imagenPerfil: {
    type: String,
    required: false,
    default: null
  },
  rol: {
    type: String,
    enum: ["superadmin", "admin", "user"],
    default: "user"
  },
  estatus: {
    type: String,
    enum: ["activo", "inactivo"],
    default: "activo"
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  ultimoLogin: {
    type: Date
  },
  requiereCambioPassword: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Hash password antes de guardar
UserSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Método para comparar passwords
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>("User", UserSchema);