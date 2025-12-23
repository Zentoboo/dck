import React, { useState } from 'react';
import { generateMetricsExport } from '../utils/metricsAnalyzer';

interface MetricsExportProps {
    folderPath: string;
}

const MetricsExport: React.FC<MetricsExportProps> = ({ folderPath }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<{
        type: 'success' | 'error' | 'info' | null;
        message: string;
    }>({ type: null, message: '' });

    const handleExport = async () => {
        if (!folderPath) {
            setExportStatus({
                type: 'error',
                message: 'No folder selected. Please select a folder first.'
            });
            return;
        }

        setIsExporting(true);
        setExportStatus({ type: 'info', message: 'Generating metrics...' });

        try {
            // Generate CSV files
            const { summary, sessions, cards } = await generateMetricsExport(folderPath);

            // Ask user where to save
            const result = await (window as any).api.selectExportDirectory();

            if (result.canceled) {
                setExportStatus({ type: null, message: '' });
                setIsExporting(false);
                return;
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to select directory');
            }

            // Get current date for filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

            // Save all three CSV files
            const summaryFilename = `performance-summary-${dateStr}.csv`;
            const sessionsFilename = `sessions-detail-${dateStr}.csv`;
            const cardsFilename = `cards-detail-${dateStr}.csv`;

            await (window as any).api.saveCsvFile(result.path, summary, summaryFilename);
            await (window as any).api.saveCsvFile(result.path, sessions, sessionsFilename);
            await (window as any).api.saveCsvFile(result.path, cards, cardsFilename);

            setExportStatus({
                type: 'success',
                message: `Metrics exported successfully to:\n${result.path}`
            });
        } catch (error) {
            console.error('Export error:', error);
            setExportStatus({
                type: 'error',
                message: `Export failed: ${error instanceof Error ? error.message : String(error)}`
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="setting-section">
            <div className="section-header">
                <h3>Export Performance Metrics</h3>
            </div>

            <div className="export-info">
                <p style={{ marginBottom: '12px', opacity: 0.8, lineHeight: '1.6' }}>
                    Export your study performance data for analysis. This includes:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '16px', lineHeight: '1.8', opacity: 0.8 }}>
                    <li>Total flashcards reviewed and study time</li>
                    <li>Average review time per card</li>
                    <li>Self-rating patterns (Again/Hard/Good/Easy)</li>
                    <li>AI evaluation usage and rating comparisons</li>
                    <li>Study session consistency metrics</li>
                </ul>
                <p style={{ marginBottom: '16px', fontSize: '0.85rem', opacity: 0.6 }}>
                    Exports three CSV files: <strong>performance-summary</strong> (overall statistics),
                    <strong>sessions-detail</strong> (per-session breakdown), and <strong>cards-detail</strong> (individual card reviews with AI ratings).
                </p>
            </div>

            <button
                className="btn-export-metrics"
                onClick={handleExport}
                disabled={isExporting || !folderPath}
            >
                {isExporting ? (
                    <>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            className="spinning"
                        >
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                        Exporting...
                    </>
                ) : (
                    <>
                        Export Performance Data (CSV)
                    </>
                )}
            </button>

            {exportStatus.type && (
                <div className={`export-status export-status-${exportStatus.type}`}>
                    {exportStatus.type === 'success' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    )}
                    {exportStatus.type === 'error' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                    {exportStatus.type === 'info' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                            <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                    <span style={{ whiteSpace: 'pre-line' }}>{exportStatus.message}</span>
                </div>
            )}
        </div>
    );
};

export default MetricsExport;