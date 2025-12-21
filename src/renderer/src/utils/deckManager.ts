// utils/DeckManager.ts
// Manages saved decks (groups of files) in localStorage

const SAVED_DECKS_KEY = 'saved-decks';
const MAX_SAVED_DECKS = 10;

export interface SavedDeck {
  id: string;           // Unique ID (timestamp-based)
  name: string;         // User-friendly name
  filePaths: string[];  // Array of file paths
  createdAt: number;    // Timestamp
  lastUsed: number;     // Timestamp
}

export class DeckManager {
  static getSavedDecks(): SavedDeck[] {
    try {
      const stored = localStorage.getItem(SAVED_DECKS_KEY);
      if (!stored) return [];
      const decks = JSON.parse(stored);
      // Sort by last used (most recent first)
      return decks.sort((a: SavedDeck, b: SavedDeck) => b.lastUsed - a.lastUsed);
    } catch (error) {
      console.error('Failed to load saved decks:', error);
      return [];
    }
  }

  static saveDeck(name: string, filePaths: string[]): SavedDeck {
    const decks = this.getSavedDecks();
    
    const newDeck: SavedDeck = {
      id: `deck-${Date.now()}`,
      name,
      filePaths,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };
    
    // Add to beginning
    const updated = [newDeck, ...decks].slice(0, MAX_SAVED_DECKS);
    
    try {
      localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save deck:', error);
    }
    
    return newDeck;
  }

  static updateDeckUsage(id: string): void {
    const decks = this.getSavedDecks();
    const deck = decks.find(d => d.id === id);
    
    if (deck) {
      deck.lastUsed = Date.now();
      try {
        localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(decks));
      } catch (error) {
        console.error('Failed to update deck usage:', error);
      }
    }
  }

  static deleteDeck(id: string): void {
    const decks = this.getSavedDecks();
    const filtered = decks.filter(d => d.id !== id);
    
    try {
      localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete deck:', error);
    }
  }

  static renameDeck(id: string, newName: string): void {
    const decks = this.getSavedDecks();
    const deck = decks.find(d => d.id === id);
    
    if (deck) {
      deck.name = newName;
      try {
        localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(decks));
      } catch (error) {
        console.error('Failed to rename deck:', error);
      }
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(SAVED_DECKS_KEY);
    } catch (error) {
      console.error('Failed to clear decks:', error);
    }
  }

  static formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
}