export type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export interface BreathingPattern {
  name: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

export const PRESETS: BreathingPattern[] = [
  { name: 'Box Breathing', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  { name: '4-7-8', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  { name: 'Relaxing', inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
  { name: 'Coherent', inhale: 6, holdIn: 0, exhale: 6, holdOut: 0 },
];
