import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  email?: string;
  credits: number;
  role: "admin" | "user";
  createdAt: Date;
  lastLogin?: Date;
  tournamentsCreated: number;
}

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  email: { 
    type: String, 
    trim: true,
    lowercase: true
  },
  credits: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  role: { 
    type: String, 
    enum: ["admin", "user"], 
    default: "user" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  },
  tournamentsCreated: { 
    type: Number, 
    default: 0 
  }
});

// Index for faster queries
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
