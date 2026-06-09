import type { BreathingPhase } from '../types/breathing';

export type AmbientSound = 'rain' | 'waves' | 'wind';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientType: AmbientSound | null = null;

  constructor() {
    this.init();
  }

  private createAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private init() {
    // Create an audio element for background keep-alive
    // This needs to be a real file or a generated blob to work well on mobile
    // For now, we'll keep the silent audio element as a fallback for session persistence.
    // Generate a very low-volume noise WAV blob and use it as the background audio source.
    // iOS PWAs often ignore truly silent tracks; a tiny audible (very low volume) loop is more reliable.
    try {
      const blob = this.generateNoiseBlob(2);
      this.backgroundAudio = new Audio(URL.createObjectURL(blob));
      this.backgroundAudio.loop = true;
      this.backgroundAudio.volume = 0.02; // keep it inaudible but non-zero
      // Ensure playsinline for mobile playback policies
      (this.backgroundAudio as any).playsInline = true;
      this.backgroundAudio.setAttribute('playsinline', 'true');
    } catch (e) {
      // Fallback to the previous silent data URI if generation fails
      this.backgroundAudio = new Audio();
      this.backgroundAudio.loop = true;
      this.backgroundAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAAAAAAAAAAAAACCAAAAAAAAAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////w==';
    }
  }

  public async start() {
    this.createAudioContext();

    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (this.backgroundAudio && this.backgroundAudio.paused) {
      try {
        await this.backgroundAudio.play();
      } catch (e) {
        console.error('Failed to play background audio', e);
      }
    }

    this.updateMediaSession('inhale');
  }

  public pause() {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }
  }

  public muteBackground() {
    if (this.backgroundAudio) {
      try {
        this.backgroundAudio.muted = true;
      } catch {}
    }
  }

  public unmuteBackground() {
    if (this.backgroundAudio) {
      try {
        this.backgroundAudio.muted = false;
      } catch {}
    }
  }

  private createWhiteNoiseBuffer(durationSeconds = 3): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * durationSeconds, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  private createAmbientNodes(type: AmbientSound): { source: AudioBufferSourceNode; inputNode: AudioNode } {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.createWhiteNoiseBuffer(4);
    source.loop = true;

    let inputNode: AudioNode = source;

    const filter = this.audioContext.createBiquadFilter();

    switch (type) {
      case 'rain':
        filter.type = 'highpass';
        filter.frequency.value = 600;
        filter.Q.value = 0.8;
        source.connect(filter);
        inputNode = filter;
        break;
      case 'waves':
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.7;
        source.connect(filter);
        inputNode = filter;
        break;
      case 'wind':
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        filter.Q.value = 0.5;
        source.connect(filter);
        inputNode = filter;
        break;
    }

    return { source, inputNode };
  }

  public async startAmbient(type: AmbientSound = 'rain', volume = 0.16) {
    this.createAudioContext();

    if (!this.audioContext) {
      return;
    }

    if (this.ambientSource && this.ambientType === type) {
      return;
    }

    if (this.ambientSource) {
      this.pauseAmbient();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const { source, inputNode } = this.createAmbientNodes(type);
    const gain = this.audioContext.createGain();
    gain.gain.value = volume;

    inputNode.connect(gain);
    gain.connect(this.audioContext.destination);

    source.start();
    this.ambientSource = source;
    this.ambientGain = gain;
    this.ambientType = type;
  }

  public pauseAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch {
        // no-op
      }
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }

    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }

    this.ambientType = null;
  }

  private generateNoiseBlob(durationSeconds = 2): Blob {
    const sampleRate = 44100;
    const length = sampleRate * durationSeconds;
    const channels = 1;

    const buffer = new Float32Array(length * channels);
    // low amplitude noise so it's effectively inaudible but counts as audio
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = (Math.random() * 2 - 1) * 0.02; // very low amplitude
    }

    // Encode WAV (16-bit PCM)
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    let offset = 0;
    function writeString(s: string) {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset + i, s.charCodeAt(i));
      }
      offset += s.length;
    }

    writeString('RIFF'); // ChunkID
    view.setUint32(offset, 36 + dataSize, true); offset += 4; // ChunkSize
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size
    view.setUint16(offset, 1, true); offset += 2; // AudioFormat (PCM)
    view.setUint16(offset, channels, true); offset += 2; // NumChannels
    view.setUint32(offset, sampleRate, true); offset += 4; // SampleRate
    view.setUint32(offset, byteRate, true); offset += 4; // ByteRate
    view.setUint16(offset, blockAlign, true); offset += 2; // BlockAlign
    view.setUint16(offset, 16, true); offset += 2; // BitsPerSample
    writeString('data');
    view.setUint32(offset, dataSize, true); offset += 4; // Subchunk2Size

    // Write PCM samples
    let pos = offset;
    for (let i = 0; i < buffer.length; i++) {
      // clamp
      let sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  public playCue(phase: BreathingPhase) {
    if (!this.audioContext) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return; // don't play cues while backgrounded/locked

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
        ],
      });

      navigator.mediaSession.playbackState = 'playing';
    }
  }
}

export const audioManager = new AudioManager();
