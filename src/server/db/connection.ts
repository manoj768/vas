import mongoose from "mongoose";

let isConnecting = false;
let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected) {
    return true;
  }

  const rawUri = process.env.MONGODB_URI;
  const uri = rawUri ? rawUri.trim() : "";
  
  // Graceful fallback when MONGODB_URI is not set or not a valid MongoDB scheme
  if (!uri || (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))) {
    return false;
  }

  if (isConnecting) {
    return false;
  }

  try {
    isConnecting = true;
    const dbName = process.env.MONGODB_DB_NAME || "evalo_valuation";
    
    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 50, // Optimal connection pooling for high-concurrency (up to 1 Lakh cases/mo)
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // Build compound indexes
    });

    isConnected = true;
    console.log(`[Database] Successfully connected to MongoDB Database: ${dbName}`);
    return true;
  } catch (error) {
    console.error("[Database] MongoDB connection failed:", error);
    isConnected = false;
    return false;
  } finally {
    isConnecting = false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function getDbHealth() {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    return { status: "local_memory_fallback", engine: "Filesystem JSON & In-Memory Store" };
  }
  return {
    status: "connected",
    engine: "MongoDB Community Server",
    database: mongoose.connection.name,
    host: mongoose.connection.host,
  };
}
