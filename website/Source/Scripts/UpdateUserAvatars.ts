// Script to update existing users with their Discord avatars
import mongoose from 'mongoose';
import { DashboardUser } from '../Models/DashboardUser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URI = process.env.DATABASE_URI || "";

async function updateUserAvatars() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(DATABASE_URI);
    console.log('✅ Connected to database');

    // Get all users
    const users = await DashboardUser.find();
    console.log(`📊 Found ${users.length} users to check`);

    let updatedCount = 0;

    for (const user of users) {
      if (!user.avatar) {
        console.log(`⚠️ User ${user.username} (${user.discordId}) - No avatar stored, will be fetched on next login`);
      } else {
        console.log(`✅ User ${user.username} (${user.discordId}) - Avatar OK`);
      }
    }

    console.log(`\n✅ Check complete. Users will have avatars updated on their next login.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateUserAvatars();
