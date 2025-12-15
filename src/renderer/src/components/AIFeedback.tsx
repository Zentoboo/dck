import React from 'react';
import { AIEvaluation } from '../ai/AIProvider';

interface AIFeedbackProps {
    evaluation: AIEvaluation;
}

const AIFeedback: React.FC<AIFeedbackProps> = ({ evaluation }) => {
    const getLevelLabel = (level: string): string => {
        return level
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getRatingLabel = (rating: number): string => {
        const labels = ['', 'Again', 'Hard', 'Good', 'Easy'];
        return labels[rating];
    };

    return (
        <div className="ai-feedback">
            <div className="ai-feedback-header">
                <h3>AI Evaluation</h3>
                <div className="ai-score">
                    <span className="score-number">{evaluation.overallScore}%</span>
                    <span className="score-label">Overall</span>
                </div>
            </div>

            <div className="suggested-rating-box">
                <span className="suggested-label">AI Suggests:</span>
                <div className="rating-display">
                    <span className={`rating-badge rating-${evaluation.suggestedRating}`}>
                        {evaluation.suggestedRating}
                    </span>
                    <span className="rating-text">{getRatingLabel(evaluation.suggestedRating)}</span>
                </div>
            </div>

            <div className="evaluation-categories">
                {/* Accuracy */}
                <div className="category-section">
                    <h4>Accuracy</h4>
                    <div className="category-content">
                        <span className="level-badge">{getLevelLabel(evaluation.accuracy.level)}</span>
                        <p className="explanation">{evaluation.accuracy.explanation}</p>
                    </div>
                </div>

                {/* Completeness */}
                <div className="category-section">
                    <h4>Completeness</h4>
                    <div className="category-content">
                        <span className="level-badge">{getLevelLabel(evaluation.completeness.level)}</span>
                        {evaluation.completeness.missingPoints && evaluation.completeness.missingPoints.length > 0 && (
                            <div className="missing-points">
                                <strong>Missing:</strong>
                                <ul>
                                    {evaluation.completeness.missingPoints.map((point, i) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Clarity */}
                <div className="category-section">
                    <h4>Clarity</h4>
                    <div className="category-content">
                        <span className="level-badge">{getLevelLabel(evaluation.clarity.level)}</span>
                        {evaluation.clarity.suggestion && (
                            <p className="suggestion">{evaluation.clarity.suggestion}</p>
                        )}
                    </div>
                </div>

                {/* Reasoning */}
                <div className="category-section">
                    <h4>Reasoning Quality</h4>
                    <div className="category-content">
                        <span className="level-badge">{getLevelLabel(evaluation.reasoning.level)}</span>
                        {evaluation.reasoning.explanation && (
                            <p className="explanation">{evaluation.reasoning.explanation}</p>
                        )}
                    </div>
                </div>

                {/* Structure */}
                <div className="category-section">
                    <h4>Answer Structure</h4>
                    <div className="category-content">
                        <span className="level-badge">{getLevelLabel(evaluation.structure.level)}</span>
                        {evaluation.structure.feedback && (
                            <p className="feedback">{evaluation.structure.feedback}</p>
                        )}
                    </div>
                </div>

                {/* Keywords Analysis */}
                <div className="category-section">
                    <h4>Keywords ({evaluation.keywordAnalysis.keywordScore}%)</h4>
                    <div className="category-content">
                        {evaluation.keywordAnalysis.foundKeywords.length > 0 && (
                            <div className="keywords-found">
                                <strong>Found:</strong>
                                <div className="keyword-tags">
                                    {evaluation.keywordAnalysis.foundKeywords.map((kw, i) => (
                                        <span key={i} className="keyword-tag found">{kw}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {evaluation.keywordAnalysis.missingKeywords.length > 0 && (
                            <div className="keywords-missing">
                                <strong>Missing:</strong>
                                <div className="keyword-tags">
                                    {evaluation.keywordAnalysis.missingKeywords.map((kw, i) => (
                                        <span key={i} className="keyword-tag missing">{kw}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Improvements */}
            {evaluation.improvements.length > 0 && (
                <div className="feedback-section improvements">
                    <h4>Suggested Improvements</h4>
                    <ul>
                        {evaluation.improvements.map((improvement, i) => (
                            <li key={i}>{improvement}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Strengths */}
            {evaluation.strengths.length > 0 && (
                <div className="feedback-section strengths">
                    <h4>Strengths</h4>
                    <ul>
                        {evaluation.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AIFeedback;