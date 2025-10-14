import { Phrase } from './types';

export const INITIAL_COINS = 500;
export const ENVELOPE_COST = 100;
export const IMAGES_PER_ENVELOPE = 3;

export const LOGO_URL = "https://i.imghippo.com/files/cGjt3084yro.png";
export const DEFAULT_PIC_URL = "https://i.postimg.cc/gkZQjwvr/Dise-o-sin-t-tulo.png";

export const INITIAL_PHRASES: Phrase[] = [
  { id: 'yes', text: 'Sí', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'no', text: 'No', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'happy', text: 'Me siento feliz', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'sad', text: 'Me siento triste', selectedImageId: null, isCustom: false, privacy: 'private' },
  { id: 'help', text: 'Necesito ayuda', selectedImageId: null, isCustom: false, privacy: 'private' }
];