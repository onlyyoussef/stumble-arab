import mongoose from "mongoose";
import crypto from "crypto";
import { User } from "../Models/User";

const MONGODB_URI = "mongodb+srv://malek14322011_db_user:C7EpyqUmYDAjO3h4@cluster0.1bg99ox.mongodb.net/?appName=Cluster0";

async function fixAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      rejectUnauthorized: false,
      family: 4,
    });
    console.log("✅ Connected to MongoDB");

    // Delete ALL admin users (old ones)
    console.log("🗑️  Deleting old admin users...");
    await User.deleteMany({ username: { $in: ["admin", "totxlabinot12*"] } });
    console.log("✅ Deleted old admin users");

    const username = "totxlabinot12*";
    const password = "totxlabinot12*";
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Create new admin
    console.log("🔨 Creating new admin user...");
    const admin = await User.create({
      username,
      password: hashedPassword,
      email: "admin@tournament.com",
      credits: 1000, // Start with 1000 credits
      role: "admin"
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("═══════════════════════════════════════");
    console.log("📧 Username:", username);
    console.log("🔑 Password:", password);
    console.log("💳 Credits:", admin.credits);
    console.log("👑 Role:", admin.role);
    console.log("═══════════════════════════════════════");
    console.log("\n🎉 You can now login at http://localhost:8080/login");
    console.log("✅ Copy and paste these credentials!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdmin();
