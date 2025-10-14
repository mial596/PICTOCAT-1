import { GameMode } from './types';

export const GAMES_DATA: Record<string, {name: string, description: string}> = {
  mouseHunt: { 
    name: 'Caza Ratones',
    description: '¡Atrapa a los ratones antes de que se escapen!' 
  },
  catMemory: { 
    name: 'Memoria Felina',
    description: 'Pon a prueba tu memoria con tus gatos desbloqueados.'
  },
  simonSays: {
    name: 'Miau Simón',
    description: 'Repite la secuencia de maullidos. ¡No te equivoques!'
  },
  catTrivia: {
    name: 'Triviatos',
    description: '¿Cuánto sabes sobre tu colección de gatos?'
  },
  felineRhythm: {
    name: 'Ritmo Felino',
    description: '¡Sigue el ritmo y no falles ninguna nota musical!'
  }
};

export const GAME_MODES: GameMode[] = [
  // --- Mouse Hunt Modes ---
  {
    gameId: 'mouseHunt',
    id: 'mouseHunt-easy',
    name: 'Fácil',
    gridSize: 9,
    mouseDuration: 1200,
    gameDuration: 30,
    maxMice: 1,
    rewardMultiplier: 1,
    description: "Gana ~10 monedas y 5 XP por acierto."
  },
  {
    gameId: 'mouseHunt',
    id: 'mouseHunt-medium',
    name: 'Normal',
    gridSize: 9,
    mouseDuration: 900,
    gameDuration: 30,
    maxMice: 2,
    rewardMultiplier: 1.5,
    description: "Gana ~15 monedas y 7 XP por acierto."
  },
  {
    gameId: 'mouseHunt',
    id: 'mouseHunt-hard',
    name: 'Difícil',
    gridSize: 12,
    mouseDuration: 650,
    gameDuration: 30,
    maxMice: 3,
    rewardMultiplier: 2.5,
    description: "Gana ~25 monedas y 12 XP por acierto."
  },
  // --- Cat Memory Modes ---
  {
    gameId: 'catMemory',
    id: 'catMemory-easy',
    name: 'Fácil',
    pairCount: 4,
    gameDuration: 75,
    rewardPerPair: 15,
    minImagesRequired: 4,
    description: "Encuentra 4 pares. ¡Un buen calentamiento!"
  },
  {
    gameId: 'catMemory',
    id: 'catMemory-medium',
    name: 'Normal',
    pairCount: 6,
    gameDuration: 100,
    rewardPerPair: 20,
    minImagesRequired: 6,
    description: "Encuentra 6 pares. ¡Un reto divertido!"
  },
  {
    gameId: 'catMemory',
    id: 'catMemory-hard',
    name: 'Difícil',
    pairCount: 8,
    gameDuration: 120,
    rewardPerPair: 25,
    minImagesRequired: 8,
    description: "Encuentra 8 pares. ¡Para memorias expertas!"
  },
  // --- Miau Simón Modes ---
  {
    gameId: 'simonSays',
    id: 'simonSays-easy',
    name: 'Fácil',
    gameDuration: 120, // max time for the whole game
    initialSequenceLength: 3,
    speedMs: 800,
    rewardPerRound: 5,
    description: "Ritmo tranquilo para empezar."
  },
  {
    gameId: 'simonSays',
    id: 'simonSays-medium',
    name: 'Normal',
    gameDuration: 120,
    initialSequenceLength: 3,
    speedMs: 500,
    rewardPerRound: 8,
    description: "Un reto para tus reflejos felinos."
  },
  {
    gameId: 'simonSays',
    id: 'simonSays-hard',
    name: 'Difícil',
    gameDuration: 120,
    initialSequenceLength: 4,
    speedMs: 350,
    rewardPerRound: 12,
    description: "¡Velocidad endiablada! Solo para expertos."
  },
  // --- Cat Trivia Modes ---
  {
    gameId: 'catTrivia',
    id: 'catTrivia-easy',
    name: 'Fácil',
    gameDuration: 0, // Not used, time is per question
    questionCount: 5,
    timePerQuestion: 10,
    rewardPerCorrect: 10,
    minImagesRequired: 4, 
    description: "5 preguntas sobre los temas de tus gatos."
  },
  {
    gameId: 'catTrivia',
    id: 'catTrivia-hard',
    name: 'Difícil',
    gameDuration: 0, // Not used, time is per question
    questionCount: 10,
    timePerQuestion: 7,
    rewardPerCorrect: 15,
    minImagesRequired: 8,
    description: "10 preguntas rápidas. ¡Demuestra tu conocimiento!"
  },
  // --- Feline Rhythm Modes ---
  {
    gameId: 'felineRhythm',
    id: 'felineRhythm-normal',
    name: 'Normal',
    gameDuration: 60,
    noteCount: 50,
    rewardMultiplier: 2,
    description: 'Un ritmo pegadizo para probar tus reflejos.'
  }
];