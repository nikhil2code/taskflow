const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: "admin" });
    
    if (!adminExists) {
      // Get admin credentials from env
      const adminEmail = process.env.ADMIN_EMAIL || "admin@taskflow.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin
      await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        roleLevel: 5,
        accountApproved: true,
        accountStatus: "ACTIVE",
        isActive: true
      });
      
      console.log(`✅ Admin created: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log("✅ Admin already exists");
    }
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

module.exports = seedAdmin;