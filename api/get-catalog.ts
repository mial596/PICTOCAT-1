// api/get-catalog.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { CatImage } from '../types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    const catsCollection = db.collection('cats');
    
    // Fetch cats from the database, sorting by the stable numeric_id to ensure a consistent order.
    const catsFromDb = await catsCollection.find({}).sort({ numeric_id: 1 }).toArray();

    // Map the database documents to the CatImage type expected by the frontend.
    const catCatalog: CatImage[] = catsFromDb.map(cat => ({
      id: cat.numeric_id, // Use the stable, numeric ID for frontend operations.
      url: cat.url,
      theme: cat.theme
    }));

    return res.status(200).json(catCatalog);
  } catch (error) {
    console.error('Get catalog error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
  }
}