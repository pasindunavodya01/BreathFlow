import { useEffect, useRef, useState } from 'react';
import type { BreathingPhase } from '../types/breathing';

interface PiPVisualizerProps {
  isActive: boolean;
  phase: BreathingPhase;
  timeLeft: number;
}

export const PiPVisualizer = ({ isActive, phase, timeLeft }: PiPVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPipActive, setIsPipActive] = useState(false);

  // Constants for drawing
  const WIDTH = 512;
  const HEIGHT = 512;

  const getPhaseColor = (phase: BreathingPhase) => {
    switch (phase) {
      case 'inhale': return '#3b82f6'; // blue-500
      case 'hold-in': return '#2563eb'; // blue-600
      case 'exhale': return '#10b981'; // emerald-500
      case 'hold-out': return '#059669'; // emerald-600
      default: return '#1e293b'; // slate-800
    }
  };

  const getPhaseText = (phase: BreathingPhase) => {
    switch (phase) {
      case 'inhale': return "INHALE";
      case 'hold-in': return "HOLD";
      case 'exhale': return "EXHALE";
      case 'hold-out': return "HOLD";
      default: return "READY";
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const color = isActive ? getPhaseColor(phase) : '#1e293b';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Text configuration
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    // Timer
    ctx.font = 'bold 120px sans-serif';
    ctx.fillText(isActive ? timeLeft.toString() : '--', WIDTH / 2, HEIGHT / 2 - 20);

    // Phase Text
    ctx.font = '500 40px sans-serif';
    ctx.fillText(isActive ? getPhaseText(phase) : "READY", WIDTH / 2, HEIGHT / 2 + 80);

    // Brand/Footer
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText("BreathFlow", WIDTH / 2, HEIGHT - 30);
  };

  // Redraw whenever props change
  useEffect(() => {
    draw();
  }, [isActive, phase, timeLeft]);

  // Setup stream once
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // Ensure initial draw
    draw();

    // Capture stream
    const stream = canvas.captureStream(30); // 30 FPS
    video.srcObject = stream;

    // We need to play the video for PiP to work, but it can be muted
    video.muted = true;

    // Handle PiP events
    const onEnterPip = () => setIsPipActive(true);
    const onLeavePip = () => setIsPipActive(false);

    video.addEventListener('enterpictureinpicture', onEnterPip);
    video.addEventListener('leavepictureinpicture', onLeavePip);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnterPip);
      video.removeEventListener('leavepictureinpicture', onLeavePip);
    };
  }, []);

  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        // Must be playing to enter PiP
        await videoRef.current.play();
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Failed to toggle PiP:", err);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="absolute opacity-0 pointer-events-none"
        style={{ left: '-9999px' }}
      />
      <video
        ref={videoRef}
        width={WIDTH}
        height={HEIGHT}
        muted
        playsInline
        loop
        className="absolute opacity-0 pointer-events-none"
        style={{ left: '-9999px' }}
      />

      {/* PiP Toggle Button */}
      <button
        onClick={togglePiP}
        className={`p-2 rounded-full transition-colors ${
          isPipActive ? 'text-blue-400 bg-blue-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Picture in Picture"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
          <path d="M12 14h7v-5h-7v5z" />
          <line x1="16" y1="12" x2="16" y2="12.01" />
        </svg>
      </button>
    </>
  );
};
