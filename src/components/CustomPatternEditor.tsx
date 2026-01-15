import { useState } from 'react';
import type { BreathingPattern } from '../types/breathing';

interface CustomPatternEditorProps {
    initialPattern?: BreathingPattern;
    onSave: (pattern: BreathingPattern) => void;
    onCancel: () => void;
}

export const CustomPatternEditor = ({ initialPattern, onSave, onCancel }: CustomPatternEditorProps) => {
    const [pattern, setPattern] = useState<BreathingPattern>(
        initialPattern || { name: 'Custom', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 }
    );

    const handleChange = (field: keyof BreathingPattern, value: any) => {
        setPattern(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Custom Pattern</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Name</label>
                        <input 
                            type="text" 
                            value={pattern.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm text-slate-400 mb-1">Inhale (s)</label>
                            <input 
                                type="number" 
                                min="1"
                                value={pattern.inhale}
                                onChange={(e) => handleChange('inhale', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Hold (s)</label>
                            <input 
                                type="number" 
                                min="0"
                                value={pattern.holdIn}
                                onChange={(e) => handleChange('holdIn', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Exhale (s)</label>
                            <input 
                                type="number" 
                                min="1"
                                value={pattern.exhale}
                                onChange={(e) => handleChange('exhale', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Hold (s)</label>
                            <input 
                                type="number" 
                                min="0"
                                value={pattern.holdOut}
                                onChange={(e) => handleChange('holdOut', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onCancel}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(pattern)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-medium"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
