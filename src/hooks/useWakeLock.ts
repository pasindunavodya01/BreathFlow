import { useState, useEffect, useCallback } from 'react';

export const useWakeLock = () => {
  // Using 'any' for wakeLock as standard TypeScript DOM libs sometimes lack WakeLockSentinel 
  const [wakeLock, setWakeLock] = useState<any>(null);
  const isSupported = typeof window !== 'undefined' && 'wakeLock' in navigator;

  const requestWakeLock = useCallback(async () => {
    if (isSupported) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        
        lock.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
          setWakeLock(null);
        });
        
        console.log('Screen Wake Lock acquired');
      } catch (err: any) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock !== null) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wakeLock, requestWakeLock]);

  return { isSupported, requestWakeLock, releaseWakeLock };
};