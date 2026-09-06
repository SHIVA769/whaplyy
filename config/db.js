import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsstore_saas';
    mongoose.connection.on('error', (error) => {
      console.error(`[Database Error] ${error.message}`);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. API requests will return 503 until it reconnects.');
    });
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      bufferTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    console.log('[Database] MongoDB is unavailable. Data endpoints will return an error until it is reachable.');
    return null;
  }
};
