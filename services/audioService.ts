// services/audioService.ts

// --- Sound Effects Service (for games) ---
class SoundService {
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private isMuted: boolean = false;

    constructor() {
        this.loadSound('select', 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_b7637b7444.mp3?filename=select-103043.mp3');
        this.loadSound('catMeow', 'https://cdn.pixabay.com/download/audio/2022/02/16/audio_73199ee94a.mp3?filename=meow-6228.mp3');
        this.loadSound('mouseSqueak', 'https://cdn.pixabay.com/download/audio/2022/11/20/audio_75f4e3c596.mp3?filename=mouse-squeak-6311.mp3');
        this.loadSound('gameOver', 'https://cdn.pixabay.com/download/audio/2022/03/14/audio_32c96b3a24.mp3?filename=videogame-death-sound-43894.mp3');
        this.loadSound('reward', 'https://cdn.pixabay.com/download/audio/2022/03/23/audio_a8d7986c72.mp3?filename=success-fanfare-trumpets-6185.mp3');
        this.loadSound('favoriteOn', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_8941a293ce.mp3?filename=button-124476.mp3');
        this.loadSound('favoriteOff', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2db1574041.mp3?filename=negative_beeps-6008.mp3');
        this.loadSound('simonError', 'https://cdn.pixabay.com/download/audio/2022/10/24/audio_a47d2c31e9.mp3?filename=error-126627.mp3');
        this.loadSound('simon1', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb63023258.mp3?filename=button-3-122974.mp3');
        this.loadSound('simon2', 'https://cdn.pixabay.com/download/audio/2022/03/29/audio_23b2553a81.mp3?filename=button-pressed-38129.mp3');
        this.loadSound('simon3', 'https://cdn.pixabay.com/download/audio/2022/04/14/audio_517e0892c5.mp3?filename=button-9-123301.mp3');
        this.loadSound('simon4', 'https://cdn.pixabay.com/download/audio/2022/03/22/audio_35b6782554.mp3?filename=mouse-click-153941.mp3');
    }

    private loadSound(name: string, src: string) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.sounds[name] = audio;
    }

    play(name: string) {
        if (this.isMuted) return;
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.error(`Error playing sound ${name}:`, error));
        } else {
            console.warn(`Sound not found: ${name}`);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            Object.values(this.sounds).forEach(sound => sound.pause());
        }
    }
}

export const soundService = new SoundService();


// --- Text-to-Speech Service (NEW) ---
class TextToSpeechService {
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private preferredVoice: SpeechSynthesisVoice | null = null;
    private isInitialized = false;

    constructor() {
        this.synthesis = window.speechSynthesis;
        // The 'voiceschanged' event is crucial for reliably getting voices.
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = this.loadVoices;
        }
        this.loadVoices(); // Initial attempt to load voices
    }

    private loadVoices = () => {
        this.voices = this.synthesis.getVoices();
        if (this.voices.length > 0) {
            this.isInitialized = true;
            // Prioritize high-quality Google voices for Spanish, then fallback to any Spanish voice.
            this.preferredVoice =
                this.voices.find(voice => voice.lang === 'es-ES' && voice.name.includes('Google')) ||
                this.voices.find(voice => voice.lang === 'es-MX' && voice.name.includes('Google')) ||
                this.voices.find(voice => voice.lang.startsWith('es-')) ||
                null;
        }
    }
    
    // A promise-based check to ensure voices are loaded before speaking
    private ensureInitialized(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isInitialized) {
                resolve();
            } else {
                const interval = setInterval(() => {
                    if (this.isInitialized) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    public async speak(text: string): Promise<void> {
        await this.ensureInitialized();
        
        if (this.synthesis.speaking) {
           this.synthesis.cancel(); // Stop any currently speaking utterance
        }

        if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
            };

            if (this.preferredVoice) {
                utterance.voice = this.preferredVoice;
            } else {
                console.warn("No preferred Spanish voice found, using browser default.");
            }
            
            utterance.lang = this.preferredVoice?.lang || 'es-ES';
            utterance.pitch = 1;
            utterance.rate = 1;
            utterance.volume = 1;
            
            this.synthesis.speak(utterance);
        }
    }
}

export const ttsService = new TextToSpeechService();
