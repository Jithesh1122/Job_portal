import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

const createAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'Admin User';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }

  await connectDB();

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    existingAdmin.name = name;
    existingAdmin.password = password;
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    console.log(`Admin user updated: ${email}`);
    return;
  }

  await User.create({
    name,
    email,
    password,
    role: 'admin',
  });

  console.log(`Admin user created: ${email}`);
};

createAdmin()
  .catch((error) => {
    console.error('Failed to create admin:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
