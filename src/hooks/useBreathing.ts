import { useState, useEffect, useRef, useCallback } from 'react';
import type { BreathingPattern, BreathingPhase } from '../types/breathing';
import { audioManager } from '../utils/audio';

export interface BreathingState {
  phase: BreathingPhase;
  timeLeft: number; 
  isActive: boolean;
  totalTime: number;
}

export const useBreathing = (pattern: BreathingPattern) => {
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [timeLeft, setTimeLeft] = useState(pattern.inhale);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { type, phase: newPhase, timeLeft: newTimeLeft, totalTime: newTotalTime } = e.data;
      
      if (type === 'TICK') {
        setTimeLeft(newTimeLeft);
        setTotalTime(newTotalTime);
      } else if (type === 'PHASE_CHANGE') {
        setPhase(newPhase);
        audioManager.playCue(newPhase);
      } else if (type === 'STOPPED') {
         // handle stop
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // When pattern changes, configure the worker
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CONFIGURE', payload: pattern });
      // Reset local state for display
      if (!isActive) {
          setPhase('inhale');
          setTimeLeft(pattern.inhale);
      }
    }
  }, [pattern, isActive]);

  const start = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
    audioManager.start();
    workerRef.current?.postMessage({ type: 'START' });
  }, [isActive]);

  const pause = useCallback(() => {
    setIsActive(false);
    audioManager.pause();
    workerRef.current?.postMessage({ type: 'PAUSE' });
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    audioManager.pause();
    workerRef.current?.postMessage({ type: 'STOP' });
    setPhase('inhale');
    setTimeLeft(pattern.inhale);
    setTotalTime(0);
  }, [pattern]);

  return {
    phase,
    timeLeft,
    isActive,
    totalTime,
    start,
    pause,
    stop
  };
};
