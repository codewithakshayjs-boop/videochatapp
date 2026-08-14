import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGO_URI) return console.warn('MONGO_URI is missing; session persistence is disabled.');
  try { await mongoose.connect(process.env.MONGO_URI); console.log('MongoDB connected'); }
  catch (error) { console.warn(`MongoDB unavailable: ${error.message}. Continuing without persistence.`); }
}
