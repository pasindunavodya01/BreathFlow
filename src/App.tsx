import { useState, useRef } from 'react';
import { useBreathing } from './hooks/useBreathing';
import { type BreathingPattern, PRESETS } from './types/breathing';
import { MeditationTypes } from './components/MeditationTypes';
import { CustomPatternEditor } from './components/CustomPatternEditor';
import { Reports } from './components/Reports';
import { getSessions, saveSession } from './utils/storage';

function App() {
  const [pattern, setPattern] = useState<BreathingPattern>(PRESETS[0]);
  const [showCustom, setShowCustom] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    phase,
    timeLeft,
    isActive,
    totalTime,
    start,
    pause,
    stop
  } = useBreathing(pattern);

  /* ---------------- iOS-SAFE AUDIO CONTROLS ---------------- */

  const playAudio = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.volume = 1;
        await audioRef.current.play(); // MUST be user-triggered
      }
    } catch (e) {
      console.error('Audio blocked by iOS', e);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /* ---------------- APP CONTROLS ---------------- */

  const handleStart = async () => {
    await playAudio(); // iOS requires audio FIRST
    start();
  };

  const handlePause = () => {
    pause();
    pauseAudio();
  };

  const handleStop = () => {
    if (totalTime > 0) {
      saveSession(totalTime, pattern.name);
    }
    stop();
    stopAudio();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    if (!isActive) return "Ready";
    switch (phase) {
      case 'inhale': return "Inhale";
      case 'hold-in': return "Hold";
      case 'exhale': return "Exhale";
      case 'hold-out': return "Hold";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">

      {/* 🔊 REQUIRED FOR iOS BACKGROUND AUDIO */}
      <audio
        ref={audioRef}
        src="/breathing.mp3"
        playsInline
        preload="auto"
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-950 to-transparent">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          BreathFlow
        </h1>
        <button onClick={() => setShowReports(true)}>
          📊
        </button>
      </header>

      {/* Main */}
      <main className="flex flex-col items-center justify-center min-h-screen p-6 pb-24">

        {/* Breathing Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          <div
            className={`w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-1000
              ${phase === 'inhale' ? 'bg-blue-500 scale-110' : ''}
              ${phase === 'hold-in' ? 'bg-blue-600 scale-110' : ''}
              ${phase === 'exhale' ? 'bg-emerald-500 scale-90' : ''}
              ${phase === 'hold-out' ? 'bg-emerald-600 scale-90' : ''}
              ${!isActive ? 'bg-slate-800 scale-100' : ''}
            `}
          >
            <div className="text-3xl font-bold">
              {isActive ? timeLeft : pattern.inhale}
            </div>
            <div className="text-sm uppercase opacity-80">
              {getPhaseText()}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-6 mb-12">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="w-16 h-16 rounded-full bg-blue-600 text-white"
            >
              ▶
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="w-16 h-16 rounded-full bg-slate-700"
              >
                ⏸
              </button>
              <button
                onClick={handleStop}
                className="w-16 h-16 rounded-full bg-red-700"
              >
                ⏹
              </button>
            </>
          )}
        </div>

        <div className="text-slate-400">
          Session: {formatTime(totalTime)}
        </div>

        {!isActive && (
          <MeditationTypes
            patterns={PRESETS}
            selectedPattern={pattern}
            onSelect={setPattern}
            onCustom={() => setShowCustom(true)}
          />
        )}
      </main>

      {showCustom && (
        <CustomPatternEditor
          onSave={(p) => {
            setPattern(p);
            setShowCustom(false);
          }}
          onCancel={() => setShowCustom(false)}
        />
      )}

      {showReports && (
        <Reports
          sessions={getSessions()}
          onClose={() => setShowReports(false)}
        />
      )}
    </div>
  );
}

export default App;
