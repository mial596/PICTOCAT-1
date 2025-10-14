// api/_utils/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.PICTOCAT1_MONGODB_URI;

// The promise of a connection is cached, not the connection itself.
// This prevents multiple connections being opened in parallel during a cold start.
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// This check is important, but we should not throw at the module level.
// We will initialize the clientPromise only if the URI exists.
if (uri) {
    if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        const globalWithMongo = globalThis as typeof globalThis & {
            _mongoClientPromise?: Promise<MongoClient>;
        };

        if (!globalWithMongo._mongoClientPromise) {
            client = new MongoClient(uri);
            globalWithMongo._mongoClientPromise = client.connect();
        }
        clientPromise = globalWithMongo._mongoClientPromise;
    } else {
        // In production mode, it's best to not use a global variable.
        client = new MongoClient(uri);
        clientPromise = client.connect();
    }
}

export async function getDb(): Promise<Db> {
    // A more robust check inside the function that gets called by the API handlers.
    // This will throw an error that can be caught by the handler, preventing a function crash.
    if (!uri || !clientPromise) {
        throw new Error('Error de Configuración del Servidor: La variable de entorno PICTOCAT1_MONGODB_URI no está definida.');
    }
    const connectedClient = await clientPromise;
    const db = connectedClient.db('pictocat1');
    return db;
}