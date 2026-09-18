import mongoose from "mongoose";
import crypto from "crypto";
import { User } from "../Models/User";

const MONGODB_URI = "mongodb+srv://malek14322011_db_user:C7EpyqUmYDAjO3h4@cluster0.1bg99ox.mongodb.net/?appName=Cluster0";

async function createAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      rejectUnauthorized: false,
      family: 4,
    });
    console.log("✅ Connected to MongoDB");

    const username = "totxlabinot12*";
    const password = "totxlabinot12*"; // Change this to a secure password!
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      
      // Update password and ensure admin role
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      if (existingAdmin.credits < 100) {
        existingAdmin.credits = 100;
      }
      await existingAdmin.save();
      console.log("✅ Updated existing user to admin with new password and 100 credits");
    } else {
      // Delete old admin if exists
      await User.deleteOne({ username: "admin" });
      
      // Create new admin
      const admin = await User.create({
        username,
        password: hashedPassword,
        email: "admin@tournament.com",
        credits: 100,
        role: "admin"
      });

      console.log("✅ Admin user created successfully!");
      console.log("📧 Username:", username);
      console.log("🔑 Password:", password);
      console.log("💳 Credits:", admin.credits);
    }

    console.log("\n🎉 You can now login with these credentials at http://localhost:8080/login");
    console.log("⚠️  IMPORTANT: Change the password after first login!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
