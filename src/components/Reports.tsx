import { useMemo } from 'react';
import type { SessionRecord } from '../utils/storage';

interface ReportsProps {
    sessions: SessionRecord[];
    onClose: () => void;
}

export const Reports = ({ sessions, onClose }: ReportsProps) => {
    const stats = useMemo(() => {
        const totalSessions = sessions.length;
        const totalMinutes = Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / 60);
        
        // Group by day (last 7 days could be a chart, but list is fine for now)
        return { totalSessions, totalMinutes };
    }, [sessions]);

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatDuration = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-40 overflow-auto">
             <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">History</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        Close
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="text-3xl font-bold text-blue-400">{stats.totalSessions}</div>
                        <div className="text-sm text-slate-500">Total Sessions</div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <div className="text-3xl font-bold text-purple-400">{stats.totalMinutes}</div>
                        <div className="text-sm text-slate-500">Total Minutes</div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mb-4 text-slate-300">Recent Sessions</h3>
                
                <div className="space-y-3 flex-1">
                    {sessions.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">No sessions yet.</div>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-white">{session.patternName}</div>
                                    <div className="text-xs text-slate-500">{formatDate(session.date)}</div>
                                </div>
                                <div className="text-slate-300 font-mono text-sm">
                                    {formatDuration(session.duration)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        </div>
    );
};
