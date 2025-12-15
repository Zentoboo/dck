// Manages recent folders in localStorage

const RECENT_FOLDERS_KEY = 'recent-folders';
const MAX_RECENT_FOLDERS = 5;

export interface RecentFolder {
  path: string;
  name: string;
  lastAccessed: number; // timestamp
}

export class FolderManager {
  static getRecentFolders(): RecentFolder[] {
    try {
      const stored = localStorage.getItem(RECENT_FOLDERS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load recent folders:', error);
      return [];
    }
  }

  static getLastFolder(): RecentFolder | null {
    const folders = this.getRecentFolders();
    return folders.length > 0 ? folders[0] : null;
  }

  static addFolder(path: string): void {
    const name = this.extractFolderName(path);
    const folders = this.getRecentFolders();
    
    // Remove if already exists
    const filtered = folders.filter(f => f.path !== path);
    
    // Add to beginning
    const updated: RecentFolder[] = [
      {
        path,
        name,
        lastAccessed: Date.now()
      },
      ...filtered
    ].slice(0, MAX_RECENT_FOLDERS); // Keep only MAX_RECENT_FOLDERS
    
    try {
      localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent folder:', error);
    }
  }

  static removeFolder(path: string): void {
    const folders = this.getRecentFolders();
    const filtered = folders.filter(f => f.path !== path);
    
    try {
      localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove folder:', error);
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(RECENT_FOLDERS_KEY);
    } catch (error) {
      console.error('Failed to clear recent folders:', error);
    }
  }

  private static extractFolderName(path: string): string {
    // Extract folder name from path
    // Handle both Windows and Unix paths
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || 'Unknown';
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
    
    // Format as date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
}