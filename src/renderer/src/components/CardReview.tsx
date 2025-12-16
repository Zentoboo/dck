import React, { useState } from 'react';
import { Rating } from 'ts-fsrs';
import { marked } from 'marked';
import AIFeedback from './AIFeedback';
import { getAIEvaluator } from '../ai/AIEvaluator';
import { AIEvaluation } from '../ai/AIProvider';

interface ReviewCard {
  questionId: string;
  question: string;
  answer: string;
  sourceFile: string;
}

interface CardReviewProps {
  card: ReviewCard;
  cardNumber: number;
  totalCards: number;
  isStudyMode: boolean;
  onReview: (userAnswer: string, rating: Rating, aiEvaluation?: AIEvaluation) => void;
  onSkip: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onEndSession: () => void;
}

const CardReview: React.FC<CardReviewProps> = ({
  card,
  cardNumber,
  totalCards,
  isStudyMode,
  onReview,
  onSkip,
  onUndo,
  canUndo,
  onEndSession
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const evaluator = getAIEvaluator();
  const aiAvailable = evaluator.isAvailable();

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleAICheck = async () => {
    if (!userAnswer.trim()) {
      setAiError('Please type an answer first');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const result = await evaluator.evaluate(
        card.question,
        card.answer,
        userAnswer
      );
      setAiEvaluation(result);
    } catch (error) {
      console.error('AI evaluation failed:', error);
      setAiError(error instanceof Error ? error.message : 'AI check failed. Check your internet connection and API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRating = (rating: Rating) => {
    onReview(userAnswer, rating, aiEvaluation || undefined);
    setUserAnswer('');
    setShowAnswer(false);
    setAiEvaluation(null);
    setAiError(null);
  };

  const renderMarkdown = (text: string): string => {
    try {
      return marked(text) as string;
    } catch (error) {
      return text;
    }
  };

  return (
    <div className="flashcard-session-container">
      <div className="flashcard-modal card-review-modal">
        <div className="modal-header">
          <div className="card-progress">
            <span>Card {cardNumber} of {totalCards}</span>
            <span className="card-mode">{isStudyMode ? 'Study Mode' : 'Review Mode'}</span>
            <span className="card-source">{card.sourceFile}</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${(cardNumber / totalCards) * 100}%` }}
            />
          </div>
          <div className="card-actions">
            <button
              className="btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo last rating"
            >
              Undo
            </button>
            <button
              className="btn-skip"
              onClick={onSkip}
              disabled={showAnswer}
              title={showAnswer ? "Cannot skip after viewing answer" : "Skip this card (comes back later)"}
            >
              Skip
            </button>
            <button
              className="btn-end-session"
              onClick={onEndSession}
              title="End session now and save progress"
            >
              End Session
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="question-section">
            <h3>Question:</h3>
            <div className="question-text">{card.question}</div>
          </div>

          {!showAnswer ? (
            <div className="answer-input-section">
              <h3>Your Answer:</h3>
              <textarea
                className="answer-textarea"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                autoFocus
              />
            </div>
          ) : (
            <div className="answer-comparison">
              <div className="your-answer-section">
                <h3>Your Answer:</h3>
                <div className="answer-text">
                  {userAnswer || <em className="no-answer">(No answer provided)</em>}
                </div>
              </div>

              {/* AI Error */}
              {aiError && (
                <div className="ai-error-box">
                  <span className="error-icon">⚠️</span>
                  <span className="error-message">{aiError}</span>
                  {aiError.includes('internet') || aiError.includes('API') ? (
                    <button className="btn-retry" onClick={handleAICheck}>
                      Retry
                    </button>
                  ) : null}
                </div>
              )}

              {/* AI Feedback */}
              {aiEvaluation && <AIFeedback evaluation={aiEvaluation} />}

              <div className="expected-answer-section">
                <h3>Expected Answer:</h3>
                <div
                  className="answer-text markdown-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(card.answer) }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!showAnswer ? (
            <div className="answer-actions">
              <button className="btn-primary btn-show-answer" onClick={handleShowAnswer}>
                Show Answer
              </button>
            </div>
          ) : (
            <>
              {aiAvailable && !aiEvaluation && !aiLoading && (
                <div className="ai-check-section">
                  <button
                    className="btn-ai-check"
                    onClick={handleAICheck}
                    disabled={!userAnswer.trim()}
                    title="Get AI feedback on your answer"
                  >
                    Check with AI
                  </button>
                </div>
              )}
              {aiLoading && (
                <div className="ai-loading-section">
                  <span className="ai-loading-text">Checking with AI...</span>
                </div>
              )}
              <div className="rating-buttons">
                <button
                  className="btn-rating btn-again"
                  onClick={() => handleRating(Rating.Again)}
                >
                  <span className="rating-label">Again</span>
                  <span className="rating-desc">Completely wrong</span>
                </button>
                <button
                  className="btn-rating btn-hard"
                  onClick={() => handleRating(Rating.Hard)}
                >
                  <span className="rating-label">Hard</span>
                  <span className="rating-desc">Partially correct</span>
                </button>
                <button
                  className="btn-rating btn-good"
                  onClick={() => handleRating(Rating.Good)}
                >
                  <span className="rating-label">Good</span>
                  <span className="rating-desc">Correct</span>
                </button>
                <button
                  className="btn-rating btn-easy"
                  onClick={() => handleRating(Rating.Easy)}
                >
                  <span className="rating-label">Easy</span>
                  <span className="rating-desc">Perfect</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardReview;