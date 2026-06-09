import { useState, useEffect, useCallback, useRef } from 'react';

export const useWakeLock = () => {
  // Using 'any' for wakeLock as standard TypeScript DOM libs sometimes lack WakeLockSentinel
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [usingNoSleep, setUsingNoSleep] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const isNativeSupported = typeof window !== 'undefined' && 'wakeLock' in navigator;
  const isSupported = isNativeSupported || typeof window !== 'undefined';

  const releaseNoSleep = useCallback(async () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // ignore close errors
      }
      audioContextRef.current = null;
    }

    setUsingNoSleep(false);
  }, []);

  const requestNoSleep = useCallback(async () => {
    if (usingNoSleep || typeof window === 'undefined') {
      return;
    }

    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AudioCtx) {
      console.warn('NoSleep fallback unavailable: AudioContext not supported');
      return;
    }

    const audioContext = new AudioCtx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    gainNode.gain.value = 0;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1;

    try {
      await audioContext.resume();
      oscillator.start();

      audioContextRef.current = audioContext;
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
      setUsingNoSleep(true);
      console.log('NoSleep fallback started');
    } catch (err) {
      console.error('NoSleep fallback failed', err);
      await releaseNoSleep();
    }
  }, [releaseNoSleep, usingNoSleep]);

  const requestWakeLock = useCallback(async () => {
    if (wakeLock !== null || usingNoSleep) {
      return;
    }

    if (isNativeSupported) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);

        lock.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
          setWakeLock(null);
        });

        console.log('Screen Wake Lock acquired');
        return;
      } catch (err: any) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }

    await requestNoSleep();
  }, [isNativeSupported, requestNoSleep, wakeLock, usingNoSleep]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock !== null) {
      await wakeLock.release();
      setWakeLock(null);
      return;
    }

    await releaseNoSleep();
  }, [wakeLock, releaseNoSleep]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const lockActive = wakeLock !== null || usingNoSleep;
      if (lockActive && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [usingNoSleep, wakeLock, requestWakeLock]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
      releaseNoSleep();
    };
  }, [releaseWakeLock, releaseNoSleep]);

  return { isSupported, requestWakeLock, releaseWakeLock };
};