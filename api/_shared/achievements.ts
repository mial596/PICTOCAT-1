// api/_shared/achievements.ts
import { Achievement, AchievementId } from '../../types.js';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Colección
  {
    id: 'collector_1',
    name: "Coleccionista Principiante",
    description: "Desbloquea tus primeros gatos.",
    category: 'Colección',
    stat: 'unlockedImageIds.length',
    tiers: [
      { value: 10, coins: 50, xp: 20 },
      { value: 25, coins: 100, xp: 50 },
      { value: 50, coins: 250, xp: 100 },
    ],
  },
  // Economía
  {
    id: 'millionaire_1',
    name: "Ahorrador Felino",
    description: "Acumula una pequeña fortuna.",
    category: 'Economía',
    stat: 'coins',
    tiers: [
      { value: 1000, coins: 100, xp: 50 },
      { value: 5000, coins: 250, xp: 100 },
      { value: 10000, coins: 500, xp: 200 },
    ],
  },
  {
    id: 'envelopes_1',
    name: "Abre-sobres",
    description: "La emoción de descubrir qué hay dentro.",
    category: 'Economía',
    stat: 'envelopesOpened',
    tiers: [
        { value: 5, coins: 25, xp: 10 },
        { value: 20, coins: 100, xp: 40 },
        { value: 50, coins: 250, xp: 100 },
    ]
  },
  // Social
  {
    id: 'social_1',
    name: "Gato Amigable",
    description: "Haz nuevos amigos en la comunidad.",
    category: 'Social',
    stat: 'friends.length',
    tiers: [
      { value: 1, coins: 50, xp: 25 },
      { value: 5, coins: 150, xp: 75 },
      { value: 10, coins: 300, xp: 150 },
    ],
  },
  {
    id: 'creator_1',
    name: "Creador de Contenido",
    description: "Comparte tus frases con la comunidad.",
    category: 'Social',
    stat: 'publicPhrases',
    tiers: [
      { value: 1, coins: 30, xp: 15 },
      { value: 5, coins: 100, xp: 50 },
      { value: 15, coins: 250, xp: 125 },
    ],
  },
  // Juegos
  {
    id: 'gamer_1',
    name: "Jugador Casual",
    description: "Juega a los minijuegos para ganar premios.",
    category: 'Juegos',
    stat: 'gamesPlayed',
    tiers: [
      { value: 5, coins: 50, xp: 25 },
      { value: 25, coins: 200, xp: 100 },
      { value: 100, coins: 500, xp: 250 },
    ],
  },
  // Progresión
  {
    id: 'leveled_up_1',
    name: "Subiendo de Nivel",
    description: "Gana experiencia y sube de nivel.",
    category: 'Progresión',
    stat: 'playerStats.level',
    tiers: [
      { value: 5, coins: 100, xp: 0 },
      { value: 10, coins: 250, xp: 0 },
      { value: 20, coins: 500, xp: 0 },
    ],
  },
];
