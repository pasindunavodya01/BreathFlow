import { useState, useEffect } from 'react';
import { useBreathing } from './hooks/useBreathing';
import { useWakeLock } from './hooks/useWakeLock';
import { type BreathingPattern, PRESETS } from './types/breathing';
import { MeditationTypes } from './components/MeditationTypes';
import { CustomPatternEditor } from './components/CustomPatternEditor';
import { Reports } from './components/Reports';
import { PiPVisualizer } from './components/PiPVisualizer';
import { audioManager, type AmbientSound } from './utils/audio';
import { getSessions, saveSession } from './utils/storage';

function App() {
  const [pattern, setPattern] = useState<BreathingPattern>(PRESETS[0]);
  const [showCustom, setShowCustom] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientSound>('rain');
  
  const { phase, timeLeft, isActive, totalTime, start, pause, stop } = useBreathing(pattern);
  const { requestWakeLock, releaseWakeLock, usingFallback, isNativeActive } = useWakeLock();

  useEffect(() => {
    if (isActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => { releaseWakeLock(); };
  }, [isActive, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    if (isAmbientPlaying) {
      audioManager.startAmbient(selectedAmbient);
    } else {
      audioManager.pauseAmbient();
    }
  }, [isAmbientPlaying, selectedAmbient]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // pause ambient and mute background audio so it doesn't produce audible artifacts
        audioManager.pauseAmbient();
        audioManager.muteBackground();
      } else {
        // unmute background and restore ambient if user had it enabled
        audioManager.unmuteBackground();
        if (isAmbientPlaying) audioManager.startAmbient(selectedAmbient);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAmbientPlaying, selectedAmbient]);

  // Auto-save when stopping manually or finishing (if we had auto-finish)
  const handleStop = () => {
    if (totalTime > 0) {
        saveSession(totalTime, pattern.name);
    }
    stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Visualizing the circle
  const getPhaseText = () => {
    if (!isActive) return "Ready";
    switch (phase) {
      case 'inhale': return "Inhale";
      case 'hold-in': return "Hold";
      case 'exhale': return "Exhale";
      case 'hold-out': return "Hold";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-950 to-transparent">
        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          BreathFlow
        </h1>
        <div className="flex items-center gap-2">
            <PiPVisualizer isActive={isActive} phase={phase} timeLeft={timeLeft} />
            <div className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {isNativeActive ? 'Wake: Native' : usingFallback ? 'Wake: Fallback' : 'Wake: Off'}
            </div>
            <button
              onClick={() => setShowReports(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen p-6 pb-24">
        
        {/* Breathing Circle */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
            {/* Outer rings for decoration */}
            <div className={`absolute inset-0 rounded-full border-2 border-slate-800 transition-all duration-1000 ${isActive ? 'scale-110 opacity-50' : 'scale-100 opacity-20'}`}></div>
            <div className={`absolute inset-4 rounded-full border border-slate-700 transition-all duration-1000 ${isActive ? 'scale-105 opacity-50' : 'scale-100 opacity-20'}`}></div>
            
            {/* The main breathing circle */}
            <div 
                className={`w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all duration-[var(--duration)] ease-linear
                ${phase === 'inhale' ? 'bg-blue-500 scale-110' : ''}
                ${phase === 'hold-in' ? 'bg-blue-600 scale-110' : ''}
                ${phase === 'exhale' ? 'bg-emerald-500 scale-90' : ''}
                ${phase === 'hold-out' ? 'bg-emerald-600 scale-90' : ''}
                ${!isActive ? 'bg-slate-800 scale-100' : ''}
                `}
                style={{
                     // We can try to dynamically set transition duration based on phase length if we had it easily accessible here
                     // For now, let's just rely on the CSS classes transition
                     transitionDuration: isActive ? `${timeLeft < 1 ? 0.5 : 1}s` : '0.5s'
                }}
            >
                <div className="text-3xl font-bold">{isActive ? timeLeft : pattern.inhale}</div>
                <div className="text-sm uppercase tracking-wider font-medium opacity-80 mt-1">{getPhaseText()}</div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-4 justify-center">
            {!isActive ? (
                <button 
                    onClick={start}
                    className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M8 5v14l11-7z"/></svg>
                </button>
            ) : (
                <>
                    <button 
                        onClick={pause}
                        className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-all"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </button>
                    <button 
                        onClick={handleStop}
                        className="w-16 h-16 rounded-full bg-slate-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900 flex items-center justify-center border border-slate-700 transition-all"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
                    </button>
                </>
            )}
            <button
              onClick={() => setIsAmbientPlaying((prev) => !prev)}
              className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all ${isAmbientPlaying ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}
            >
              <span className="text-xl">{isAmbientPlaying ? '🔊' : '🔇'}</span>
            </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
            {([
              { id: 'rain', label: 'Rain', emoji: '☔' },
              { id: 'waves', label: 'Waves', emoji: '🌊' },
              { id: 'wind', label: 'Wind', emoji: '🍃' },
            ] as const).map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedAmbient(option.id)}
                className={`px-3 py-2 rounded-full border text-sm font-semibold transition-colors ${selectedAmbient === option.id ? 'bg-slate-700 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                <span className="mr-2">{option.emoji}</span>
                {option.label}
              </button>
            ))}
        </div>

        {/* Total Time */}
        <div className="text-slate-500 font-mono mb-8">
            Session: {formatTime(totalTime)}
        </div>

        {/* Pattern Selection */}
        {!isActive && (
            <div className="w-full max-w-md px-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Select Pattern</h3>
                <MeditationTypes 
                    patterns={PRESETS} 
                    selectedPattern={pattern} 
                    onSelect={setPattern}
                    onCustom={() => setShowCustom(true)}
                />
            </div>
        )}

      </main>

      {/* Modals */}
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
