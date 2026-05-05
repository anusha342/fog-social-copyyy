import { MongoClient } from "mongodb"

const uri = process.env.NODE_ENV === "production" 
  ? process.env.MONGODB_URI_PROD 
  : process.env.MONGODB_URI_DEV

if (!uri) throw new Error("MONGODB_URI is not set")

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // Re-use the client across hot reloads in dev to avoid exhausting connections.
  const g = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  if (!g._mongoClientPromise) {
    g._mongoClientPromise = new MongoClient(uri).connect()
  }
  clientPromise = g._mongoClientPromise
} else {
  clientPromise = new MongoClient(uri).connect()
}

export default clientPromise
