import React, { useState, useEffect } from 'react';

interface SessionFile {
    name: string;
    path: string;
    timestamp: Date;
}

interface SessionsListProps {
    folderPath: string;
    selectedSession: string | null;
    onSessionSelect: (path: string) => void;
}

const SessionsList: React.FC<SessionsListProps> = ({ folderPath, selectedSession, onSessionSelect }) => {
    const [sessions, setSessions] = useState<SessionFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, [folderPath]);

    const loadSessions = async (): Promise<void> => {
        setLoading(true);
        try {
            const sessionsPath = `${folderPath}/.sessions`;
            const files = await window.api.readMdFiles(sessionsPath);

            const sessionFiles: SessionFile[] = files
                .filter(f => f.name.startsWith('session.'))
                .map(f => {
                    const match = f.name.match(/session\.(\d{4}-\d{2}-\d{2}-\d{2}-\d{2})\.md/);
                    let timestamp = new Date();
                    if (match) {
                        const year = parseInt(match[1].slice(0, 4));
                        const month = parseInt(match[1].slice(5, 7)) - 1;
                        const day = parseInt(match[1].slice(8, 10));
                        const hour = parseInt(match[1].slice(11, 13));
                        const minute = parseInt(match[1].slice(14, 16));
                        timestamp = new Date(year, month, day, hour, minute);
                    }
                    return { name: f.name, path: f.path, timestamp };
                })
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            setSessions(sessionFiles);
        } catch (error) {
            setSessions([]);
        }
        setLoading(false);
    };

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return <p className="session-loading">Loading...</p>;
    }

    if (sessions.length === 0) {
        return <p className="no-sessions">No sessions yet</p>;
    }

    return (
        <div className="sessions-list">
            {sessions.map((session, index) => (
                <div
                    key={session.path}
                    className={`session-list-item ${selectedSession === session.path ? 'selected' : ''}`}
                    onClick={() => onSessionSelect(session.path)}
                >
                    <span className="session-number">#{sessions.length - index}</span>
                    <span className="session-time">{formatDate(session.timestamp)}</span>
                </div>
            ))}
        </div>
    );
};

export default SessionsList;