import React from 'react';

interface SessionCompleteProps {
  cardsReviewed: number;
  duration: number;
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  onClose: () => void;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({
  cardsReviewed,
  duration,
  ratings,
  onClose
}) => {
  const correctCount = ratings.good + ratings.easy;
  const percentage = cardsReviewed > 0
    ? Math.round((correctCount / cardsReviewed) * 100)
    : 0;

  return (
    <div className="flashcard-session-container">
      <div className="flashcard-modal session-complete-modal">
        <div className="modal-header">
          <h2>Session Complete</h2>
        </div>

        <div className="modal-content">
          <div className="session-stats">
            <div className="stat-item">
              <span className="stat-label">Cards Reviewed:</span>
              <span className="stat-value">{cardsReviewed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{duration}s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accuracy:</span>
              <span className="stat-value">{percentage}%</span>
            </div>
          </div>

          <div className="rating-breakdown">
            <h3>Performance Breakdown:</h3>
            <div className="rating-bars">
              <div className="rating-bar">
                <span className="rating-name">Again:</span>
                <div className="bar-container">
                  <div
                    className="bar bar-again"
                    style={{ width: `${cardsReviewed > 0 ? (ratings.again / cardsReviewed) * 100 : 0}%` }}
                  />
                </div>
                <span className="rating-count">{ratings.again}</span>
              </div>

              <div className="rating-bar">
                <span className="rating-name">Hard:</span>
                <div className="bar-container">
                  <div
                    className="bar bar-hard"
                    style={{ width: `${cardsReviewed > 0 ? (ratings.hard / cardsReviewed) * 100 : 0}%` }}
                  />
                </div>
                <span className="rating-count">{ratings.hard}</span>
              </div>

              <div className="rating-bar">
                <span className="rating-name">Good:</span>
                <div className="bar-container">
                  <div
                    className="bar bar-good"
                    style={{ width: `${cardsReviewed > 0 ? (ratings.good / cardsReviewed) * 100 : 0}%` }}
                  />
                </div>
                <span className="rating-count">{ratings.good}</span>
              </div>

              <div className="rating-bar">
                <span className="rating-name">Easy:</span>
                <div className="bar-container">
                  <div
                    className="bar bar-easy"
                    style={{ width: `${cardsReviewed > 0 ? (ratings.easy / cardsReviewed) * 100 : 0}%` }}
                  />
                </div>
                <span className="rating-count">{ratings.easy}</span>
              </div>
            </div>
          </div>

          <p className="session-note">
            Session has been saved to <code>.sessions/</code> folder
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionComplete;