const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  roleLevel: Number,
  accountApproved: Boolean,
  accountStatus: String,
});

const User = mongoose.model('User', userSchema);

async function fixAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);
    
    // Update or create admin
    const result = await User.updateOne(
      { email: 'admin@taskflow.com' },
      {
        $set: {
          name: 'Super Admin',
          email: 'admin@taskflow.com',
          password: hashedPassword,
          role: 'admin',
          roleLevel: 5,
          accountApproved: true,
          accountStatus: 'ACTIVE'
        }
      },
      { upsert: true }
    );
    
    console.log('✅ Admin fixed!');
    console.log('Email: admin@taskflow.com');
    console.log('Password: Admin123!');
    console.log('You can now login with these credentials');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAdmin();