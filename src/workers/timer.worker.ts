// This worker handles the timing to ensure it runs even when the main thread is throttled.

export type TimerAction = 'START' | 'PAUSE' | 'STOP' | 'CONFIGURE';

export interface TimerMessage {
  type: TimerAction;
  payload?: any;
}

export interface TimerState {
  pattern: {
    inhale: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
  };
  phase: 'inhale' | 'hold-in' | 'exhale' | 'hold-out';
  timeLeft: number; // in milliseconds roughly
  totalTime: number;
  isActive: boolean;
}

let intervalId: any = null;
let state: TimerState = {
  pattern: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  phase: 'inhale',
  timeLeft: 4000,
  totalTime: 0,
  isActive: false,
};
let targetSeconds: number | null = null;

let lastTick = Date.now();

const getNextPhase = (current: string, pattern: any) => {
  switch (current) {
    case 'inhale': return pattern.holdIn > 0 ? 'hold-in' : 'exhale';
    case 'hold-in': return 'exhale';
    case 'exhale': return pattern.holdOut > 0 ? 'hold-out' : 'inhale';
    case 'hold-out': return 'inhale';
  }
  return 'inhale';
};

const getDuration = (phase: string, pattern: any) => {
  switch (phase) {
    case 'inhale': return pattern.inhale;
    case 'hold-in': return pattern.holdIn;
    case 'exhale': return pattern.exhale;
    case 'hold-out': return pattern.holdOut;
  }
  return 4;
};

const tick = () => {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;

  if (!state.isActive) return;

  state.timeLeft -= delta;
  state.totalTime += delta;

  if (state.timeLeft <= 0) {
    // Phase change
    const nextPhase = getNextPhase(state.phase, state.pattern);
    state.phase = nextPhase as any;
    const duration = getDuration(nextPhase, state.pattern) * 1000;
    
    // Adjust for drift, but don't let it be negative
    state.timeLeft = duration + state.timeLeft; 
    
    postMessage({ type: 'PHASE_CHANGE', phase: state.phase, duration: duration / 1000 });
  }

  // Check for target session end (in seconds)
  if (targetSeconds !== null) {
    if (state.totalTime >= targetSeconds * 1000) {
      // Stop the session
      state.isActive = false;
      state.phase = 'inhale';
      state.timeLeft = state.pattern.inhale * 1000;
      if (intervalId) clearInterval(intervalId);
      postMessage({ type: 'STOPPED', totalTime: Math.floor(state.totalTime / 1000) });
      return;
    }
  }

  postMessage({ 
    type: 'TICK', 
    timeLeft: Math.ceil(state.timeLeft / 1000), 
    totalTime: Math.floor(state.totalTime / 1000) 
  });
};

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'CONFIGURE':
      // payload may be either a pattern object or { pattern, targetSeconds }
      if (payload && payload.pattern) {
        state.pattern = payload.pattern;
        targetSeconds = payload.targetSeconds ?? null;
      } else {
        state.pattern = payload;
        targetSeconds = null;
      }
      state.phase = 'inhale';
      state.timeLeft = state.pattern.inhale * 1000;
      state.totalTime = 0;
      break;
    case 'START':
      if (!state.isActive) {
        state.isActive = true;
        lastTick = Date.now();
        intervalId = setInterval(tick, 100); // 10Hz is enough for seconds updates
      }
      break;
    case 'PAUSE':
      state.isActive = false;
      if (intervalId) clearInterval(intervalId);
      break;
    case 'STOP':
      state.isActive = false;
      state.phase = 'inhale';
      state.timeLeft = state.pattern.inhale * 1000;
      const finalTotal = state.totalTime;
      state.totalTime = 0;
      if (intervalId) clearInterval(intervalId);
      postMessage({ type: 'STOPPED', totalTime: Math.floor(finalTotal / 1000) });
      break;
  }
};
