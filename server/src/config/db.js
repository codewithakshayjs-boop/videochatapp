import mongoose from 'mongoose';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cache mongoose connection for serverless / hot-reload environments
const GLOBAL_MONGO_KEY = Symbol.for('ai-date-chat.mongoose');
const globalSymbols = Object.getOwnPropertySymbols(globalThis);
const hasGlobal = globalSymbols.indexOf(GLOBAL_MONGO_KEY) > -1;
if (!hasGlobal) globalThis[GLOBAL_MONGO_KEY] = { conn: null };

export async function connectDatabase({ maxRetries = 5, retryDelay = 2000 } = {}) {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is missing; session persistence is disabled.');
    return;
  }

  // Return existing connection if already connected (helps serverless platforms)
  if (globalThis[GLOBAL_MONGO_KEY].conn && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return globalThis[GLOBAL_MONGO_KEY].conn;
  }

  // Disable mongoose buffering so queries fail fast when no connection is available
  mongoose.set('bufferCommands', false);

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('MongoDB connected');
      globalThis[GLOBAL_MONGO_KEY].conn = conn;
      return conn;
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
