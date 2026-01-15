import type { BreathingPattern } from '../types/breathing';

interface MeditationTypesProps {
    patterns: BreathingPattern[];
    selectedPattern: BreathingPattern;
    onSelect: (pattern: BreathingPattern) => void;
    onCustom: () => void;
}

export const MeditationTypes = ({ patterns, selectedPattern, onSelect, onCustom }: MeditationTypesProps) => {
    return (
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            {patterns.map((p) => (
                <button
                    key={p.name}
                    onClick={() => onSelect(p)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedPattern.name === p.name
                        ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                >
                    <div className="font-bold text-lg">{p.name}</div>
                    <div className="text-sm text-slate-400 mt-1">
                        In: {p.inhale}s • Hold: {p.holdIn}s • Ex: {p.exhale}s • Hold: {p.holdOut}s
                    </div>
                </button>
            ))}
             <button
                onClick={onCustom}
                className="p-4 rounded-xl border border-dashed border-slate-600 hover:border-blue-400 bg-transparent text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
                <span>+ Custom Pattern</span>
            </button>
        </div>
    );
};
