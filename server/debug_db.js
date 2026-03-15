import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Community from './models/Community.js';

dotenv.config();

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');
    const count = await Community.countDocuments();
    console.log('Community count:', count);
    const all = await Community.find();
    console.log('Communities:', all);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debug();
