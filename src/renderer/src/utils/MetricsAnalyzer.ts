// src/utils/metricsAnalyzer.ts

export interface SessionMetrics {
  sessionDate: string;
  sessionTime: string;
  cardsReviewed: number;
  duration: number; // seconds
  avgTimePerCard: number; // seconds
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  aiUsageCount: number;
  accuracyRate: number; // percentage
}

export interface OverallMetrics {
  totalSessions: number;
  totalCardsReviewed: number;
  totalStudyTime: number; // seconds
  avgTimePerCard: number; // seconds
  avgSessionDuration: number; // seconds
  avgCardsPerSession: number;
  
  // Rating distribution
  totalAgain: number;
  totalHard: number;
  totalGood: number;
  totalEasy: number;
  againPercentage: number;
  hardPercentage: number;
  goodPercentage: number;
  easyPercentage: number;
  
  // AI usage
  totalAIUsage: number;
  aiUsageRate: number; // percentage
  
  // Consistency
  studyDaysCount: number;
  avgSessionsPerDay: number;
  consistencyScore: number; // 0-100
  
  // Performance
  overallAccuracy: number; // percentage
  improvementTrend: string; // "improving", "stable", "declining"
}

export interface CardReview {
  sessionDate: string;
  fileName: string;
  question: string;
  rating: string;
  timeSpent: number; // seconds (estimated)
  aiUsed: boolean;
  accuracy: number | null; // percentage if AI was used
}

/**
 * Parse a session markdown file to extract metrics
 */
export function parseSessionFile(content: string, filename: string): SessionMetrics | null {
  try {
    // Extract date and time from filename: session.YYYY-MM-DD-HH-MM.md
    const dateMatch = filename.match(/session\.(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/);
    if (!dateMatch) return null;
    
    const [, year, month, day, hour, minute] = dateMatch;
    const sessionDate = `${year}-${month}-${day}`;
    const sessionTime = `${hour}:${minute}`;
    
    // Extract session summary data from table format
    const durationMatch = content.match(/\|\s*Total Duration\s*\|\s*(\d+)s?\s*\|/i);
    const cardsMatch = content.match(/\|\s*Cards Reviewed\s*\|\s*(\d+)\s*\|/i);
    const accuracyMatch = content.match(/\|\s*Accuracy Rate\s*\|\s*([\d.]+)%\s*\|/i);
    
    // Extract rating distribution from table format
    // Matches: | Again (1/4) | 0 | 0% |
    const againMatch = content.match(/\|\s*Again.*?\|\s*(\d+)\s*\|\s*([\d.]+)%\s*\|/i);
    const hardMatch = content.match(/\|\s*Hard.*?\|\s*(\d+)\s*\|\s*([\d.]+)%\s*\|/i);
    const goodMatch = content.match(/\|\s*Good.*?\|\s*(\d+)\s*\|\s*([\d.]+)%\s*\|/i);
    const easyMatch = content.match(/\|\s*Easy.*?\|\s*(\d+)\s*\|\s*([\d.]+)%\s*\|/i);
    
    // Count AI usage (cards with AI evaluation)
    const aiEvaluationSections = content.match(/### AI Evaluation/g);
    const aiUsageCount = aiEvaluationSections ? aiEvaluationSections.length : 0;
    
    const cardsReviewed = cardsMatch ? parseInt(cardsMatch[1]) : 0;
    const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
    
    return {
      sessionDate,
      sessionTime,
      cardsReviewed,
      duration,
      avgTimePerCard: cardsReviewed > 0 ? Math.round(duration / cardsReviewed) : 0,
      againCount: againMatch ? parseInt(againMatch[1]) : 0,
      hardCount: hardMatch ? parseInt(hardMatch[1]) : 0,
      goodCount: goodMatch ? parseInt(goodMatch[1]) : 0,
      easyCount: easyMatch ? parseInt(easyMatch[1]) : 0,
      aiUsageCount,
      accuracyRate: accuracyMatch ? parseFloat(accuracyMatch[1]) : 0
    };
  } catch (error) {
    console.error('Error parsing session file:', error);
    return null;
  }
}

/**
 * Calculate overall metrics from all sessions
 */
export function calculateOverallMetrics(sessions: SessionMetrics[]): OverallMetrics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalCardsReviewed: 0,
      totalStudyTime: 0,
      avgTimePerCard: 0,
      avgSessionDuration: 0,
      avgCardsPerSession: 0,
      totalAgain: 0,
      totalHard: 0,
      totalGood: 0,
      totalEasy: 0,
      againPercentage: 0,
      hardPercentage: 0,
      goodPercentage: 0,
      easyPercentage: 0,
      totalAIUsage: 0,
      aiUsageRate: 0,
      studyDaysCount: 0,
      avgSessionsPerDay: 0,
      consistencyScore: 0,
      overallAccuracy: 0,
      improvementTrend: 'stable'
    };
  }
  
  // Basic aggregations
  const totalSessions = sessions.length;
  const totalCardsReviewed = sessions.reduce((sum, s) => sum + s.cardsReviewed, 0);
  const totalStudyTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalAgain = sessions.reduce((sum, s) => sum + s.againCount, 0);
  const totalHard = sessions.reduce((sum, s) => sum + s.hardCount, 0);
  const totalGood = sessions.reduce((sum, s) => sum + s.goodCount, 0);
  const totalEasy = sessions.reduce((sum, s) => sum + s.easyCount, 0);
  const totalAIUsage = sessions.reduce((sum, s) => sum + s.aiUsageCount, 0);
  
  // Averages
  const avgTimePerCard = totalCardsReviewed > 0 ? Math.round(totalStudyTime / totalCardsReviewed) : 0;
  const avgSessionDuration = Math.round(totalStudyTime / totalSessions);
  const avgCardsPerSession = Math.round(totalCardsReviewed / totalSessions);
  
  // Rating percentages
  const totalRatings = totalAgain + totalHard + totalGood + totalEasy;
  const againPercentage = totalRatings > 0 ? Math.round((totalAgain / totalRatings) * 100) : 0;
  const hardPercentage = totalRatings > 0 ? Math.round((totalHard / totalRatings) * 100) : 0;
  const goodPercentage = totalRatings > 0 ? Math.round((totalGood / totalRatings) * 100) : 0;
  const easyPercentage = totalRatings > 0 ? Math.round((totalEasy / totalRatings) * 100) : 0;
  
  // AI usage rate
  const aiUsageRate = totalCardsReviewed > 0 ? Math.round((totalAIUsage / totalCardsReviewed) * 100) : 0;
  
  // Study consistency
  const uniqueDates = new Set(sessions.map(s => s.sessionDate));
  const studyDaysCount = uniqueDates.size;
  const avgSessionsPerDay = studyDaysCount > 0 ? (totalSessions / studyDaysCount).toFixed(2) : '0';
  
  // Consistency score (0-100)
  // Based on: frequency of sessions, regularity, and completion rate
  const daysCovered = studyDaysCount;
  const expectedDays = 7; // One week
  const consistencyScore = Math.min(100, Math.round((daysCovered / expectedDays) * 100));
  
  // Overall accuracy
  const sessionsWithAccuracy = sessions.filter(s => s.accuracyRate > 0);
  const overallAccuracy = sessionsWithAccuracy.length > 0
    ? Math.round(sessionsWithAccuracy.reduce((sum, s) => sum + s.accuracyRate, 0) / sessionsWithAccuracy.length)
    : 0;
  
  // Improvement trend
  const improvementTrend = calculateTrend(sessions);
  
  return {
    totalSessions,
    totalCardsReviewed,
    totalStudyTime,
    avgTimePerCard,
    avgSessionDuration,
    avgCardsPerSession,
    totalAgain,
    totalHard,
    totalGood,
    totalEasy,
    againPercentage,
    hardPercentage,
    goodPercentage,
    easyPercentage,
    totalAIUsage,
    aiUsageRate,
    studyDaysCount,
    avgSessionsPerDay: parseFloat(avgSessionsPerDay),
    consistencyScore,
    overallAccuracy,
    improvementTrend
  };
}

/**
 * Calculate improvement trend from sessions
 */
function calculateTrend(sessions: SessionMetrics[]): string {
  if (sessions.length < 3) return 'insufficient data';
  
  // Sort by date
  const sorted = [...sessions].sort((a, b) => {
    return a.sessionDate.localeCompare(b.sessionDate);
  });
  
  // Compare first third vs last third
  const firstThird = sorted.slice(0, Math.floor(sorted.length / 3));
  const lastThird = sorted.slice(-Math.floor(sorted.length / 3));
  
  const firstAvgAccuracy = firstThird.reduce((sum, s) => sum + s.accuracyRate, 0) / firstThird.length;
  const lastAvgAccuracy = lastThird.reduce((sum, s) => sum + s.accuracyRate, 0) / lastThird.length;
  
  const difference = lastAvgAccuracy - firstAvgAccuracy;
  
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate CSV content for overall summary
 */
export function generateSummaryCSV(metrics: OverallMetrics): string {
  const rows = [
    ['Metric', 'Value'],
    ['Total Sessions', metrics.totalSessions],
    ['Total Cards Reviewed', metrics.totalCardsReviewed],
    ['Total Study Time (seconds)', metrics.totalStudyTime],
    ['Total Study Time (formatted)', formatDuration(metrics.totalStudyTime)],
    ['Average Time Per Card (seconds)', metrics.avgTimePerCard],
    ['Average Session Duration (seconds)', metrics.avgSessionDuration],
    ['Average Cards Per Session', metrics.avgCardsPerSession],
    [''],
    ['Rating Distribution', ''],
    ['Total "Again" Ratings', `${metrics.totalAgain} (${metrics.againPercentage}%)`],
    ['Total "Hard" Ratings', `${metrics.totalHard} (${metrics.hardPercentage}%)`],
    ['Total "Good" Ratings', `${metrics.totalGood} (${metrics.goodPercentage}%)`],
    ['Total "Easy" Ratings', `${metrics.totalEasy} (${metrics.easyPercentage}%)`],
    [''],
    ['AI Evaluation Usage', ''],
    ['Total AI Evaluations', metrics.totalAIUsage],
    ['AI Usage Rate', `${metrics.aiUsageRate}%`],
    [''],
    ['Study Consistency', ''],
    ['Study Days Count', metrics.studyDaysCount],
    ['Average Sessions Per Day', metrics.avgSessionsPerDay],
    ['Consistency Score (0-100)', metrics.consistencyScore],
    [''],
    ['Performance', ''],
    ['Overall Accuracy Rate', `${metrics.overallAccuracy}%`],
    ['Improvement Trend', metrics.improvementTrend]
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Generate CSV content for per-session data
 */
export function generateSessionsCSV(sessions: SessionMetrics[]): string {
  const headers = [
    'Date',
    'Time',
    'Cards Reviewed',
    'Duration (seconds)',
    'Avg Time Per Card (seconds)',
    'Again',
    'Hard',
    'Good',
    'Easy',
    'AI Usage Count',
    'Accuracy Rate (%)'
  ];
  
  const rows = sessions.map(s => [
    s.sessionDate,
    s.sessionTime,
    s.cardsReviewed,
    s.duration,
    s.avgTimePerCard,
    s.againCount,
    s.hardCount,
    s.goodCount,
    s.easyCount,
    s.aiUsageCount,
    s.accuracyRate
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Generate all CSV files and return as object
 */
export async function generateMetricsExport(
  folderPath: string
): Promise<{ summary: string; sessions: string }> {
  // Read all session files
  const sessionsFolder = `${folderPath}/.sessions`;
  const files = await window.api.readMdFiles(sessionsFolder);
  
  const sessionMetrics: SessionMetrics[] = [];
  
  for (const file of files) {
    if (file.name.startsWith('session.') && file.name.endsWith('.md')) {
      const content = await window.api.readFile(file.path);
      const metrics = parseSessionFile(content, file.name);
      if (metrics) {
        sessionMetrics.push(metrics);
      }
    }
  }
  
  // Sort by date (newest first)
  sessionMetrics.sort((a, b) => {
    const dateA = `${a.sessionDate} ${a.sessionTime}`;
    const dateB = `${b.sessionDate} ${b.sessionTime}`;
    return dateB.localeCompare(dateA);
  });
  
  // Calculate overall metrics
  const overallMetrics = calculateOverallMetrics(sessionMetrics);
  
  // Generate CSV files
  const summaryCSV = generateSummaryCSV(overallMetrics);
  const sessionsCSV = generateSessionsCSV(sessionMetrics);
  
  return {
    summary: summaryCSV,
    sessions: sessionsCSV
  };
}