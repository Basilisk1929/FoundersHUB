import { MongoClient, Db } from 'mongodb';
import { localStore } from './memory-store';

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let mongoDbInstance: Db | null = null;
let useLocal = !uri;

if (uri) {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    globalWithMongo._mongoClientPromise = client.connect();
    console.log('[MongoDB] Connected to MongoDB Atlas cluster');
  }
  clientPromise = globalWithMongo._mongoClientPromise;
}

export async function getDb() {
  if (!uri || useLocal) {
    return {
      isMongo: false,
      collection: <T extends { _id: string }>(name: string) => localStore.collection<T>(name)
    };
  }

  try {
    if (!clientPromise) throw new Error("No client promise");
    const connectedClient = await clientPromise;
    if (!mongoDbInstance) {
      mongoDbInstance = connectedClient.db(process.env.MONGODB_DB || 'foundershub');
    }
    const db = mongoDbInstance;
    return {
      isMongo: true,
      collection: <T extends { _id: string }>(name: string) => {
        const col = db.collection(name);
        return {
          find: (filter: any = {}) => ({
            toArray: async () => (await col.find(filter).toArray()) as unknown as T[],
            sort: (sortObj: any) => ({
              toArray: async () => (await col.find(filter).sort(sortObj).toArray()) as unknown as T[]
            })
          }),
          findOne: async (filter: any = {}) => (await col.findOne(filter)) as unknown as T | null,
          insertOne: async (doc: any) => {
            const res = await col.insertOne(doc);
            return { insertedId: res.insertedId.toString(), acknowledged: res.acknowledged };
          },
          insertMany: async (docs: any[]) => {
            const res = await col.insertMany(docs);
            return { insertedIds: Object.values(res.insertedIds).map(id => id.toString()), acknowledged: res.acknowledged };
          },
          updateOne: async (filter: any, update: any) => {
            const res = await col.updateOne(filter, update);
            return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
          },
          updateMany: async (filter: any, update: any) => {
            const res = await col.updateMany(filter, update);
            return { matchedCount: res.matchedCount, modifiedCount: res.modifiedCount };
          },
          deleteOne: async (filter: any) => {
            const res = await col.deleteOne(filter);
            return { deletedCount: res.deletedCount };
          },
          deleteMany: async (filter: any) => {
            const res = await col.deleteMany(filter);
            return { deletedCount: res.deletedCount };
          },
          countDocuments: async (filter: any = {}) => await col.countDocuments(filter)
        };
      }
    };
  } catch (err) {
    // Graceful failover to local store if MongoDB Atlas connection times out or fails
    console.warn('[DB] MongoDB connection failed or not reachable, falling back to resilient local store:', err);
    useLocal = true;
    return {
      isMongo: false,
      collection: <T extends { _id: string }>(name: string) => localStore.collection<T>(name)
    };
  }
}
