import React from 'react';
import { DeckManager, SavedDeck } from '../utils/DeckManager';

interface FileWithStats {
  name: string;
  path: string;
  dueCount: number;
  newCount: number;
  totalCards: number;
}

export type SortOrder = 'random' | 'sequential' | 'hardest' | 'easiest';

interface FileSelectorProps {
  files: FileWithStats[];
  selectedFiles: Set<string>;
  onToggleFile: (path: string) => void;
  onSetFiles: (paths: string[]) => void;
  onStart: (studyMode: boolean, sortOrder: SortOrder) => void;
  onCancel: () => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({
  files,
  selectedFiles,
  onToggleFile,
  onSetFiles,
  onStart,
  onCancel
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [savedDecks, setSavedDecks] = React.useState<SavedDeck[]>([]);
  const [showSaveDeck, setShowSaveDeck] = React.useState(false);
  const [deckName, setDeckName] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('random');

  // Auto-enable study mode if no cards are due
  const totalDue = files.reduce((sum, f) => sum + f.dueCount + f.newCount, 0);
  const totalCards = files.reduce((sum, f) => sum + f.totalCards, 0);
  const [studyMode, setStudyMode] = React.useState(totalDue === 0 && totalCards > 0);

  // Load saved decks on mount
  React.useEffect(() => {
    setSavedDecks(DeckManager.getSavedDecks());
  }, []);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveDeck = (): void => {
    if (!deckName.trim() || selectedFiles.size === 0) return;

    const filePaths = Array.from(selectedFiles);
    DeckManager.saveDeck(deckName.trim(), filePaths);
    setSavedDecks(DeckManager.getSavedDecks());
    setDeckName('');
    setShowSaveDeck(false);
  };

  const handleLoadDeck = (deck: SavedDeck): void => {
    // Build new selection with deck files (only if they still exist)
    const validDeckFiles = deck.filePaths.filter(path =>
      files.some(f => f.path === path)
    );

    onSetFiles(validDeckFiles);

    DeckManager.updateDeckUsage(deck.id);
    setSavedDecks(DeckManager.getSavedDecks());
  };

  const handleDeleteDeck = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    DeckManager.deleteDeck(id);
    setSavedDecks(DeckManager.getSavedDecks());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();

      // Find all files that match the search and have cards
      const filesToSelect = filteredFiles.filter(file => {
        return file.totalCards > 0;
      });

      // Add all matching files to selection (bulk update)
      const newSelection = new Set(selectedFiles);
      filesToSelect.forEach(file => {
        newSelection.add(file.path);
      });

      onSetFiles(Array.from(newSelection));
    }
  };

  const selectedDueCount = files
    .filter(f => selectedFiles.has(f.path))
    .reduce((sum, f) => sum + f.dueCount + f.newCount, 0);

  const selectedTotalCount = files
    .filter(f => selectedFiles.has(f.path))
    .reduce((sum, f) => sum + f.totalCards, 0);

  const buttonCount = studyMode ? selectedTotalCount : selectedDueCount;

  return (
    <div className="flashcard-session-container">
      <div className="flashcard-modal file-selector-modal">
        <div className="modal-header">
          <h2>Start Flashcard Session</h2>
        </div>

        <div className="modal-content">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search files (e.g., biology.anatomy.) - Press Enter to select all matches"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                </svg>
              </button>
            )}
          </div>

          {savedDecks.length > 0 && (
            <div className="saved-decks-section">
              <h3>Saved Decks</h3>
              <div className="saved-decks-list">
                {savedDecks.map(deck => (
                  <div
                    key={deck.id}
                    className="saved-deck-item"
                    onClick={() => handleLoadDeck(deck)}
                  >
                    <div className="deck-info">
                      <span className="deck-name">{deck.name}</span>
                      <span className="deck-meta">{deck.filePaths.length} files • {DeckManager.formatTimestamp(deck.lastUsed)}</span>
                    </div>
                    <button
                      className="btn-delete-deck"
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                      title="Delete deck"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M0 10h24v4h-24z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="file-list">
            {filteredFiles.map(file => {
              const isSelected = selectedFiles.has(file.path);
              const hasCards = file.totalCards > 0;
              const hasDue = file.dueCount > 0 || file.newCount > 0;

              return (
                <div
                  key={file.path}
                  className={`file-item-checkbox ${isSelected ? 'selected' : ''} ${!hasCards ? 'disabled' : ''}`}
                  onClick={() => hasCards && onToggleFile(file.path)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!hasCards}
                    onChange={() => { }}
                  />
                  <span className="file-name">{file.name}</span>
                  {hasCards ? (
                    <span className="file-stats">
                      {hasDue ? (
                        <>
                          {file.dueCount > 0 && <span className="due-count">{file.dueCount} due</span>}
                          {file.newCount > 0 && <span className="new-count">{file.newCount} new</span>}
                          <span className="total-count">/ {file.totalCards} total</span>
                        </>
                      ) : (
                        <span className="no-due">0 due / {file.totalCards} total</span>
                      )}
                    </span>
                  ) : (
                    <span className="no-cards">No cards</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <div className="filter-info">
            {searchQuery && (
              <span className="filtered-count">
                Showing {filteredFiles.length} of {files.length} files
              </span>
            )}
            <label className="study-mode-toggle">
              <input
                type="checkbox"
                checked={studyMode}
                onChange={(e) => setStudyMode(e.target.checked)}
              />
              <span>Study Mode (review all cards)</span>
            </label>
            <label className="sort-order-select">
              <span>Card Order:</span>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="sort-select"
              >
                <option value="random">Random</option>
                <option value="sequential">Sequential (file order)</option>
                <option value="hardest">Hardest First</option>
                <option value="easiest">Easiest First</option>
              </select>
            </label>
          </div>
          <div className="footer-buttons">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            {selectedFiles.size > 0 && !showSaveDeck && (
              <button
                className="btn-secondary"
                onClick={() => setShowSaveDeck(true)}
              >
                Save Deck
              </button>
            )}
            {showSaveDeck && (
              <div className="save-deck-form">
                <input
                  type="text"
                  placeholder="Deck name..."
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDeck();
                    if (e.key === 'Escape') setShowSaveDeck(false);
                  }}
                  autoFocus
                />
                <button
                  className="btn-confirm-save"
                  onClick={handleSaveDeck}
                  disabled={!deckName.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                  </svg>
                </button>
                <button
                  className="btn-cancel-save"
                  onClick={() => setShowSaveDeck(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                  </svg>
                </button>
              </div>
            )}
            <button
              className="btn-primary"
              onClick={() => onStart(studyMode, sortOrder)}
              disabled={selectedFiles.size === 0 || buttonCount === 0}
            >
              {selectedFiles.size === 0 ? 'Select files' :
                buttonCount === 0 ? (studyMode ? 'No cards' : 'No cards due - enable Study Mode') :
                  `Start ${studyMode ? 'Study' : 'Review'} (${buttonCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSelector;