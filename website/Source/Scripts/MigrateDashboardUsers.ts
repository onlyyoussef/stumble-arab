import { config } from "dotenv";
config();

import mongoose from "mongoose";
import { DashboardUser } from "../Models/DashboardUser";

async function migrateDashboardUsers() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URI || "");
    console.log('✅ Connected!');
    
    console.log('\n📊 Current DashboardUsers:');
    const oldUsers = await mongoose.connection.db!.collection('dashboardusers').find({}).toArray();
    console.log(`Found ${oldUsers.length} users`);
    
    if (oldUsers.length > 0) {
      console.log('\n🗑️ Dropping old collection...');
      await mongoose.connection.db!.collection('dashboardusers').drop();
      console.log('✅ Old collection dropped!');
    }
    
    console.log('\n🔄 Creating users with new schema...');
    
    for (const oldUser of oldUsers) {
      // Generate unique 5-digit ID
      const userId = await (DashboardUser as any).generateUserId();
      
      const newUser = await DashboardUser.create({
        userId,
        discordId: oldUser.discordId,
        username: oldUser.username,
        credits: oldUser.credits || 0,
        tournamentsCreated: oldUser.tournamentsCreated || 0,
        createdAt: oldUser.createdAt || new Date(),
        lastActivity: oldUser.lastActivity || new Date()
      });
      
      console.log(`✅ Migrated: ${newUser.username} (${newUser.discordId}) - User ID: ${userId}`);
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`Total users migrated: ${oldUsers.length}`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDashboardUsers();
