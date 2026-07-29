import dns from "dns"
import { MongoClient } from "mongodb"

// Dynamically convert mongodb+srv:// to standard mongodb:// URI to bypass local DNS resolution bugs
async function resolveSrvUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri
  }

  const match = uri.match(/^mongodb\+srv:\/\/([^@]+@)?([^/?#]+)([^?#]*)(\?.*)?$/)
  if (!match) {
    return uri
  }

  const credentials = match[1] || ""
  const host = match[2]
  const path = match[3] || "/"
  const query = match[4] || ""

  const srvRecord = `_mongodb._tcp.${host}`

  let srvAddresses: dns.SrvRecord[] = []
  try {
    srvAddresses = await new Promise<dns.SrvRecord[]>((resolve, reject) => {
      dns.resolveSrv(srvRecord, (err, addresses) => {
        if (err) reject(err)
        else resolve(addresses)
      })
    })
  } catch (err) {
    // If the system DNS fails, retry using public resolvers (e.g. Google and Cloudflare DNS)
    const resolver = new dns.Resolver()
    resolver.setServers(["8.8.8.8", "1.1.1.1"])
    srvAddresses = await new Promise<dns.SrvRecord[]>((resolve, reject) => {
      resolver.resolveSrv(srvRecord, (err2, addresses2) => {
        if (err2) reject(err2)
        else resolve(addresses2)
      })
    })
  }

  let txtRecords: string[][] = []
  try {
    const resolver = new dns.Resolver()
    resolver.setServers(["8.8.8.8", "1.1.1.1"])
    txtRecords = await new Promise<string[][]>((resolve) => {
      resolver.resolveTxt(host, (err, records) => {
        if (err) resolve([])
        else resolve(records)
      })
    })
  } catch (e) {
    // TXT options are optional
  }

  const txtOptions = txtRecords.flatMap(r => r).join("&")
  const hosts = srvAddresses.map(addr => `${addr.name}:${addr.port}`).join(",")

  let mergedQuery = query ? query : "?"
  if (!mergedQuery.includes("ssl=")) {
    mergedQuery += (mergedQuery === "?" ? "" : "&") + "ssl=true"
  }
  if (txtOptions) {
    mergedQuery += "&" + txtOptions
  }

  return `mongodb://${credentials}${hosts}${path}${mergedQuery}`
}

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
    g._mongoClientPromise = resolveSrvUri(uri).then((finalUri) => {
      return new MongoClient(finalUri).connect()
    })
  }
  clientPromise = g._mongoClientPromise
} else {
  clientPromise = new MongoClient(uri).connect()
}

export default clientPromise
