import type { BreathingPhase } from '../types/breathing';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Create an audio element for background keep-alive
    // This needs to be a real file or a generated blob to work well on mobile
    // For now, I'll create a silent buffer and play it through AudioContext,
    // AND create a dummy HTMLAudioElement which is the standard trick for MediaSession
    this.backgroundAudio = new Audio();
    this.backgroundAudio.loop = true;
    
    // We'll use a silent base64 MP3 to ensure it works cross-browser
    // 1 second of silence
    this.backgroundAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAACCAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////w==';
  }

  public async start() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (this.backgroundAudio && this.backgroundAudio.paused) {
        try {
            await this.backgroundAudio.play();
        } catch (e) {
            console.error("Failed to play background audio", e);
        }
    }

    this.updateMediaSession('inhale');
  }

  public pause() {
    if (this.backgroundAudio) {
        this.backgroundAudio.pause();
    }
  }

  public playCue(phase: BreathingPhase) {
    if (!this.audioContext) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    // Different tones for different phases
    switch (phase) {
      case 'inhale':
        osc.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
        osc.frequency.linearRampToValueAtTime(440, this.audioContext.currentTime + 2); // Slide up
        break;
      case 'hold-in':
      case 'hold-out':
        osc.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        break;
      case 'exhale':
        osc.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        osc.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 2); // Slide down
        break;
    }

    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 2);

    this.updateMediaSession(phase);
  }

  private updateMediaSession(phase: BreathingPhase) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `Breathing: ${phase.toUpperCase()}`,
            artist: 'Meditation App',
            album: 'Guided Session',
            artwork: [
                { src: 'https://via.placeholder.com/96', sizes: '96x96', type: 'image/png' },
                { src: 'https://via.placeholder.com/128', sizes: '128x128', type: 'image/png' },
            ]
        });
        
        navigator.mediaSession.playbackState = 'playing';
    }
  }
}

export const audioManager = new AudioManager();
