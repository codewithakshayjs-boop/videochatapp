import mongoose from 'mongoose';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDatabase({ maxRetries = 5, retryDelay = 2000 } = {}) {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is missing; session persistence is disabled.');
    return;
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Use recommended options
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('MongoDB connected');
      return;
    } catch (error) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt >= maxRetries) {
        console.error(`MongoDB connection failed after ${attempt} attempts.`);
        throw error;
      }
      const delay = retryDelay * attempt;
      console.log(`Retrying MongoDB connection in ${delay}ms...`);
      await wait(delay);
    }
  }
}
