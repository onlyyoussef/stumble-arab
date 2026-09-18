import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const SessionSchema = new Schema<ISession>({
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  token: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  }
});

// Auto-delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);
