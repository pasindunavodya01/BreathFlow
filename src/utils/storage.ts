export interface SessionRecord {
    id: string;
    date: string; // ISO string
    duration: number; // in seconds
    patternName: string;
}

const STORAGE_KEY = 'meditation_sessions';

export const saveSession = (duration: number, patternName: string) => {
    if (duration < 10) return; // Don't save very short sessions
    
    const sessions = getSessions();
    const newSession: SessionRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        duration,
        patternName
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newSession, ...sessions]));
};

export const getSessions = (): SessionRecord[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};
