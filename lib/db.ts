import { MongoClient, MongoClientOptions } from "mongodb";

const envMongoUri = process.env.MONGODB_URI;
if (!envMongoUri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
const mongoUri: string = envMongoUri;

const options: MongoClientOptions = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
  maxIdleTimeMS: 30000,
};

type MongoGlobal = typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

function createClient(): MongoClient {
  return new MongoClient(mongoUri, options);
}

/**
 * Lazily connect and recover if a previous connect attempt failed.
 * This prevents dev mode from getting stuck on a rejected cached promise.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (globalForMongo._mongoClient) {
    return globalForMongo._mongoClient;
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = createClient();
    globalForMongo._mongoClientPromise = client
      .connect()
      .then((connectedClient) => {
        globalForMongo._mongoClient = connectedClient;
        return connectedClient;
      })
      .catch(async (error) => {
        globalForMongo._mongoClientPromise = undefined;
        globalForMongo._mongoClient = undefined;
        try {
          await client.close();
        } catch {
          // Ignore close failures on failed initial connect.
        }
        throw error;
      });
  }

  return globalForMongo._mongoClientPromise;
}
