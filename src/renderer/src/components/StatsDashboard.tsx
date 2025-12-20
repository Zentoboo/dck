import React, { useState, useEffect } from 'react';
import { FlashcardData, FlashcardFile, isDue, getDaysUntilDue } from '../utils/flashcardStorage';
import { parseMarkdownForFlashcards } from '../utils/flashcardParser';
import { State } from 'ts-fsrs';

interface StatsProps {
    folderPath: string;
    files: { name: string; path: string }[];
    onClose: () => void;
}

interface FileStats {
    name: string;
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    dueToday: number;
    avgDifficulty: number;
}

interface OverallStats {
    totalCards: number;
    totalReviews: number;
    dueToday: number;
    dueThisWeek: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    retentionRate: number;
}

const StatsDashboard: React.FC<StatsProps> = ({ files, onClose }) => {
    const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
    const [fileStats, setFileStats] = useState<FileStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [files]);

    const loadStats = async (): Promise<void> => {
        setLoading(true);
        console.log('Loading stats for', files.length, 'files');

        let totalCards = 0;
        let totalReviews = 0;
        let dueToday = 0;
        let dueThisWeek = 0;
        let newCards = 0;
        let learningCards = 0;
        let reviewCards = 0;

        const fileStatsArray: FileStats[] = [];
        // const today = new Date();

        for (const file of files) {
            console.log('Processing file:', file.name);
            const content = await window.api.readFile(file.path);
            const questions = parseMarkdownForFlashcards(content, file.name);
            console.log('  Questions found:', questions.length);

            const flashcardFile: FlashcardFile | null = await window.api.readFlashcardFile(file.path);
            const existingCards = flashcardFile?.cards || [];
            console.log('  Existing cards:', existingCards.length);
            if (existingCards.length > 0) {
                console.log('  Existing card IDs:', existingCards.map((c: FlashcardData) => c.questionId));
                existingCards.forEach((c: FlashcardData) => {
                    console.log('    ', c.questionId, '- Saved question:', c.questionId);
                });
            }

            let fileNewCards = 0;
            let fileLearningCards = 0;
            let fileReviewCards = 0;
            let fileDueToday = 0;
            let totalDifficulty = 0;
            let cardsWithDifficulty = 0;

            console.log('  Processing', questions.length, 'questions against', existingCards.length, 'existing cards');

            questions.forEach(q => {
                console.log('  Looking for question:', q.questionId, '- Text:', q.question.substring(0, 50));
                const existing = existingCards.find((c: FlashcardData) => c.questionId === q.questionId);

                if (existing) {
                    console.log('  Found existing card:', {
                        questionId: q.questionId,
                        state: existing.fsrs.state,
                        reps: existing.fsrs.reps
                    });

                    totalCards++;
                    totalReviews += existing.stats.totalReviews;

                    if (existing.fsrs.state === State.New) {
                        newCards++;
                        fileNewCards++;
                    } else if (existing.fsrs.state === State.Learning || existing.fsrs.state === State.Relearning) {
                        learningCards++;
                        fileLearningCards++;
                    } else if (existing.fsrs.state === State.Review) {
                        reviewCards++;
                        fileReviewCards++;
                    }

                    if (isDue(existing)) {
                        const daysUntil = getDaysUntilDue(existing);
                        if (daysUntil <= 0) {
                            dueToday++;
                            fileDueToday++;
                        }
                        if (daysUntil <= 7) {
                            dueThisWeek++;
                        }
                    }

                    totalDifficulty += existing.fsrs.difficulty;
                    cardsWithDifficulty++;
                } else {
                    console.log('  Card is NEW (not in .flashcard file):', q.questionId);
                    totalCards++;
                    newCards++;
                    fileNewCards++;
                }
            });

            fileStatsArray.push({
                name: file.name,
                totalCards: questions.length,
                newCards: fileNewCards,
                learningCards: fileLearningCards,
                reviewCards: fileReviewCards,
                dueToday: fileDueToday,
                avgDifficulty: cardsWithDifficulty > 0 ? totalDifficulty / cardsWithDifficulty : 0
            });
        }

        const retention = totalCards > 0 ? (reviewCards / totalCards) * 100 : 0;

        console.log('Final stats:', { totalCards, dueToday, newCards, learningCards, reviewCards });

        setOverallStats({
            totalCards,
            totalReviews,
            dueToday,
            dueThisWeek,
            newCards,
            learningCards,
            reviewCards,
            retentionRate: Math.round(retention)
        });

        setFileStats(fileStatsArray);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flashcard-session-container">
                <div className="flashcard-modal stats-modal">
                    <div className="modal-header">
                        <h2>Statistics Dashboard</h2>
                    </div>
                    <div className="modal-content">
                        <p>Loading statistics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!overallStats) {
        return (
            <div className="flashcard-session-container">
                <div className="flashcard-modal stats-modal">
                    <div className="modal-header">
                        <h2>Statistics Dashboard</h2>
                    </div>
                    <div className="modal-content">
                        <p>No statistics available.</p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-primary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flashcard-session-container">
            <div className="flashcard-modal stats-modal">
                <div className="modal-header">
                    <h2>Statistics Dashboard</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    {/* Overall Stats */}
                    <div className="stats-section">
                        <h3>Overview</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{overallStats.totalCards}</div>
                                <div className="stat-label">Total Cards</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{overallStats.totalReviews}</div>
                                <div className="stat-label">Total Reviews</div>
                            </div>
                            <div className="stat-card highlight-due">
                                <div className="stat-value">{overallStats.dueToday}</div>
                                <div className="stat-label">Due Today</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{overallStats.dueThisWeek}</div>
                                <div className="stat-label">Due This Week</div>
                            </div>
                        </div>
                    </div>

                    {/* Card States */}
                    <div className="stats-section">
                        <h3>Card Distribution</h3>
                        <div className="card-distribution">
                            <div className="distribution-bar">
                                <div
                                    className="bar-segment bar-new"
                                    style={{ width: `${(overallStats.newCards / overallStats.totalCards) * 100}%` }}
                                    title={`New: ${overallStats.newCards}`}
                                />
                                <div
                                    className="bar-segment bar-learning"
                                    style={{ width: `${(overallStats.learningCards / overallStats.totalCards) * 100}%` }}
                                    title={`Learning: ${overallStats.learningCards}`}
                                />
                                <div
                                    className="bar-segment bar-review"
                                    style={{ width: `${(overallStats.reviewCards / overallStats.totalCards) * 100}%` }}
                                    title={`Review: ${overallStats.reviewCards}`}
                                />
                            </div>
                            <div className="distribution-legend">
                                <div className="legend-item">
                                    <span className="legend-color bar-new"></span>
                                    <span>New: {overallStats.newCards}</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color bar-learning"></span>
                                    <span>Learning: {overallStats.learningCards}</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color bar-review"></span>
                                    <span>Review: {overallStats.reviewCards}</span>
                                </div>
                            </div>
                        </div>
                        <div className="retention-rate">
                            <span className="retention-label">Retention Rate:</span>
                            <span className="retention-value">{overallStats.retentionRate}%</span>
                        </div>
                    </div>

                    {/* Per-File Breakdown */}
                    <div className="stats-section">
                        <h3>Files Breakdown</h3>
                        <div className="file-stats-table">
                            <div className="table-header">
                                <div className="col-file">File</div>
                                <div className="col-total">Total</div>
                                <div className="col-new">New</div>
                                <div className="col-learning">Learning</div>
                                <div className="col-review">Review</div>
                                <div className="col-due">Due</div>
                                <div className="col-diff">Avg Diff</div>
                            </div>
                            {fileStats.map((file, index) => (
                                <div key={index} className="table-row">
                                    <div className="col-file">{file.name}</div>
                                    <div className="col-total">{file.totalCards}</div>
                                    <div className="col-new">{file.newCards}</div>
                                    <div className="col-learning">{file.learningCards}</div>
                                    <div className="col-review">{file.reviewCards}</div>
                                    <div className="col-due">{file.dueToday}</div>
                                    <div className="col-diff">{file.avgDifficulty.toFixed(1)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StatsDashboard;