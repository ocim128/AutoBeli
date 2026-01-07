import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  // Connection timeouts
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,

  // Force IPv4 (faster DNS resolution in many environments)
  family: 4,

  // Connection pool optimization
  minPoolSize: 2, // Keep minimum connections warm
  maxPoolSize: 10, // Limit max connections for serverless
  maxIdleTimeMS: 30000, // Close idle connections after 30s

  // Performance: Enable compression for large payloads
  compressors: ["zstd", "snappy", "zlib"],

  // Performance: Reduce latency with direct connection when possible
  directConnection: false,
};

console.log(`[MongoDB] Initializing client...`);

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
