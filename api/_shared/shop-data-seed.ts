// api/_shared/shop-data-seed.ts
import { Envelope, EnvelopeTypeId, GameUpgrade, UpgradeId } from '../../types.js';

export const ENVELOPES: Record<EnvelopeTypeId, Omit<Envelope, 'id'>> = {
  bronze: {
    name: 'Sobre de Bronce',
    baseCost: 75,
    costIncreasePerLevel: 5,
    imageCount: 1,
    color: 'from-orange-400 to-yellow-500',
    description: 'Una nueva imagen de gato al azar.',
    xp: 10,
    rarityProbabilities: { common: 80, rare: 15, epic: 5 },
  },
  silver: {
    name: 'Sobre de Plata',
    baseCost: 150,
    costIncreasePerLevel: 10,
    imageCount: 3,
    color: 'from-slate-400 to-gray-500',
    description: '¡Tres nuevas imágenes de gatos!',
    xp: 30,
    rarityProbabilities: { common: 60, rare: 30, epic: 10 },
  },
  gold: {
    name: 'Sobre de Oro',
    baseCost: 300,
    costIncreasePerLevel: 20,
    imageCount: 5,
    color: 'from-amber-400 to-yellow-500',
    description: '¡Cinco nuevas imágenes de gatos al azar!',
    xp: 80,
    rarityProbabilities: { common: 40, rare: 40, epic: 20 },
  }
};

export const UPGRADES: Record<UpgradeId, Omit<GameUpgrade, 'id'>> = {
  goldenPaw: {
    name: 'Pata Dorada',
    description: 'Aumenta las monedas ganadas en un 50%.',
    cost: 500,
    levelRequired: 3,
    icon: 'coin',
  },
  betterBait: {
    name: 'Cebo Mejorado',
    description: 'Los ratones permanecen visibles 250ms más en Caza Ratones.',
    cost: 350,
    levelRequired: 2,
    icon: 'mouse',
  },
  extraTime: {
    name: 'Tiempo Extra',
    description: 'Añade 5 segundos al juego Caza Ratones.',
    cost: 700,
    levelRequired: 5,
    icon: 'time'
  },
  photographicMemory: {
    name: 'Memoria Fotográfica',
    description: 'Revela todas las cartas por 1.5s al inicio de Memoria Felina.',
    cost: 600,
    levelRequired: 4,
    icon: 'brain'
  },
  smartyCat: {
    name: 'Gato Inteligente',
    description: 'Elimina una respuesta incorrecta en cada pregunta de Triviatos.',
    cost: 450,
    levelRequired: 3,
    icon: 'question'
  },
  xpBoost: {
    name: 'Bono de XP',
    description: 'Aumenta toda la experiencia (XP) ganada en un 25%.',
    cost: 1000,
    levelRequired: 6,
    icon: 'star'
  }
};

// Function to seed the database with shop data if it doesn't exist
export const seedShopData = async (db: any) => {
    const systemConfig = db.collection('system_config');
    const config = await systemConfig.findOne({ _id: 'shop_config' });

    if (!config?.isSeeded) {
        console.log("Shop data not seeded. Initializing...");

        // Seed Envelopes
        const envelopesCollection = db.collection('envelopes');
        await envelopesCollection.deleteMany({});
        const envelopeDocs = Object.entries(ENVELOPES).map(([id, data]) => ({ _id: id, ...data }));
        await envelopesCollection.insertMany(envelopeDocs);
        
        // Seed Upgrades
        const upgradesCollection = db.collection('upgrades');
        await upgradesCollection.deleteMany({});
        const upgradeDocs = Object.entries(UPGRADES).map(([id, data]) => ({ _id: id, ...data }));
        await upgradesCollection.insertMany(upgradeDocs);

        // Seed Cat Rarities
        const catsCollection = db.collection('cats');
        await catsCollection.updateMany({}, { $set: { rarity: 'common' } }); // Default all to common
        
        // Set some themes to rare
        await catsCollection.updateMany({ theme: { $in: ['Gatos en Apuros', 'Gatos Gruñones'] } }, { $set: { rarity: 'rare' } });
        
        // Set specific images to epic
        await catsCollection.updateMany({ url: { $in: [
            'https://media.tenor.com/ldNjzyrqeIMAAAAC/gato-meme.gif',
            'https://i.redd.it/elohtitdb7351.jpg',
            'https://images7.memedroid.com/images/UPLOADED475/64f8c02457e24.jpeg'
        ]}}, { $set: { rarity: 'epic' } });

        await systemConfig.updateOne({ _id: 'shop_config' }, { $set: { isSeeded: true } }, { upsert: true });
        console.log("Shop data seeded successfully.");
    }
}