import { useState, useEffect, useCallback } from 'react';
import { audioManager } from '../utils/audio';

export const useWakeLock = () => {
  // Using 'any' for wakeLock as standard TypeScript DOM libs sometimes lack WakeLockSentinel
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const isNativeSupported = typeof window !== 'undefined' && 'wakeLock' in navigator;
  const isSupported = isNativeSupported || typeof window !== 'undefined';
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = typeof window !== 'undefined' && /Android/.test(navigator.userAgent);

  const requestNoSleep = useCallback(async () => {
    if (typeof window === 'undefined' || !(isIOS || isAndroid)) return;
    try {
      await audioManager.start();
      setUsingFallback(true);
      console.log('Fallback audioManager started for wake lock (mobile)');
    } catch (err) {
      console.warn('Fallback audioManager failed to start', err);
    }
  }, []);

  const releaseNoSleep = useCallback(async () => {
    try {
      audioManager.pause();
    } catch (err) {
      // ignore
    }
    setUsingFallback(false);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (wakeLock !== null) {
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
  }, [isNativeSupported, requestNoSleep, wakeLock, usingFallback]);

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
      const lockActive = wakeLock !== null || usingFallback;
      if (lockActive && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [usingFallback, wakeLock, requestWakeLock]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
      releaseNoSleep();
    };
  }, [releaseWakeLock, releaseNoSleep]);

  const isNativeActive = wakeLock !== null;

  return { isSupported, requestWakeLock, releaseWakeLock, usingFallback, isNativeActive };
};