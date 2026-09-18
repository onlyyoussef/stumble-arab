import mongoose, { Schema, Document } from "mongoose";

export interface IDashboardUser extends Document {
  userId: number; // 5-digit unique ID
  discordId: string;
  username: string;
  avatar?: string; // Discord avatar hash
  discriminator?: string; // Discord discriminator (deprecated but kept for compatibility)
  credits: number;
  tournamentsCreated: number;
  createdAt: Date;
  lastActivity: Date;
}

const DashboardUserSchema = new Schema<IDashboardUser>({
  userId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
    min: 10000,
    max: 99999
  },
  discordId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  username: { 
    type: String, 
    required: true 
  },
  avatar: {
    type: String,
    required: false
  },
  discriminator: {
    type: String,
    required: false
  },
  credits: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  tournamentsCreated: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  }
});

// Generate unique 5-digit ID
DashboardUserSchema.statics.generateUserId = async function(): Promise<number> {
  let userId: number;
  let exists: boolean = true;
  
  while (exists) {
    userId = Math.floor(10000 + Math.random() * 90000); // 10000-99999
    const user = await this.findOne({ userId });
    exists = !!user;
  }
  
  return userId!;
};

export const DashboardUser = mongoose.model<IDashboardUser>("DashboardUser", DashboardUserSchema);
