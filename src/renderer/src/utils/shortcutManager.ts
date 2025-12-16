// Centralized keyboard shortcut management system

const SHORTCUTS_KEY = 'keyboard-shortcuts';

export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  category: 'editor' | 'file' | 'navigation' | 'session';
  defaultKey: string;
  key: string; // Current configured key
}

const DEFAULT_SHORTCUTS: Omit<ShortcutAction, 'key'>[] = [
  // Editor shortcuts
  {
    id: 'editor.save',
    name: 'Save File',
    description: 'Save current file',
    category: 'editor',
    defaultKey: 'Ctrl+S'
  },
  {
    id: 'editor.togglePreview',
    name: 'Toggle Preview',
    description: 'Switch between edit and preview mode',
    category: 'editor',
    defaultKey: 'Ctrl+P'
  },
  {
    id: 'editor.bold',
    name: 'Bold Text',
    description: 'Make selected text bold',
    category: 'editor',
    defaultKey: 'Ctrl+B'
  },
  {
    id: 'editor.italic',
    name: 'Italic Text',
    description: 'Make selected text italic',
    category: 'editor',
    defaultKey: 'Ctrl+I'
  },
  {
    id: 'editor.code',
    name: 'Inline Code',
    description: 'Make selected text inline code',
    category: 'editor',
    defaultKey: 'Ctrl+K'
  },
  {
    id: 'editor.strikethrough',
    name: 'Strikethrough',
    description: 'Strike through selected text',
    category: 'editor',
    defaultKey: 'Ctrl+U'
  },
  {
    id: 'editor.heading1',
    name: 'Heading 1',
    description: 'Make line a heading level 1',
    category: 'editor',
    defaultKey: 'Ctrl+1'
  },
  {
    id: 'editor.heading2',
    name: 'Heading 2',
    description: 'Make line a heading level 2',
    category: 'editor',
    defaultKey: 'Ctrl+2'
  },
  {
    id: 'editor.heading3',
    name: 'Heading 3',
    description: 'Make line a heading level 3',
    category: 'editor',
    defaultKey: 'Ctrl+3'
  },
  {
    id: 'editor.indent',
    name: 'Indent',
    description: 'Indent selected lines',
    category: 'editor',
    defaultKey: 'Tab'
  },
  {
    id: 'editor.unindent',
    name: 'Unindent',
    description: 'Unindent selected lines',
    category: 'editor',
    defaultKey: 'Shift+Tab'
  },
  // File shortcuts
  {
    id: 'file.new',
    name: 'New File',
    description: 'Create a new file',
    category: 'file',
    defaultKey: 'Ctrl+N'
  },
  {
    id: 'file.delete',
    name: 'Delete File',
    description: 'Delete current file',
    category: 'file',
    defaultKey: 'Ctrl+D'
  },
  // Navigation shortcuts
  {
    id: 'nav.settings',
    name: 'Open Settings',
    description: 'Open settings panel',
    category: 'navigation',
    defaultKey: 'Ctrl+,'
  },
  {
    id: 'nav.guide',
    name: 'Open Guide',
    description: 'Open user guide',
    category: 'navigation',
    defaultKey: 'Ctrl+/'
  },
  // Session shortcuts
  {
    id: 'session.start',
    name: 'Start Flashcard Session',
    description: 'Open flashcard session',
    category: 'session',
    defaultKey: 'Ctrl+F'
  },
  {
    id: 'session.stats',
    name: 'View Statistics',
    description: 'Open statistics dashboard',
    category: 'session',
    defaultKey: 'Ctrl+E'
  }
];

export class ShortcutManager {
  /**
   * Get all configured shortcuts
   */
  static getShortcuts(): ShortcutAction[] {
    try {
      const stored = localStorage.getItem(SHORTCUTS_KEY);
      if (!stored) {
        return this.getDefaultShortcuts();
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
      return this.getDefaultShortcuts();
    }
  }

  /**
   * Get default shortcuts (all set to defaultKey)
   */
  static getDefaultShortcuts(): ShortcutAction[] {
    return DEFAULT_SHORTCUTS.map(s => ({ ...s, key: s.defaultKey }));
  }

  /**
   * Save shortcuts
   */
  static saveShortcuts(shortcuts: ShortcutAction[]): void {
    try {
      localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
    }
  }

  /**
   * Reset all shortcuts to defaults
   */
  static resetToDefaults(): void {
    const defaults = this.getDefaultShortcuts();
    this.saveShortcuts(defaults);
  }

  /**
   * Reset a single shortcut to default
   */
  static resetShortcut(id: string): void {
    const shortcuts = this.getShortcuts();
    const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
    
    if (defaultShortcut) {
      const updated = shortcuts.map(s => 
        s.id === id ? { ...s, key: defaultShortcut.defaultKey } : s
      );
      this.saveShortcuts(updated);
    }
  }

  /**
   * Update a shortcut's key binding
   */
  static updateShortcut(id: string, newKey: string): boolean {
    const shortcuts = this.getShortcuts();
    
    // Check for conflicts (ignore if newKey is empty/being cleared)
    if (newKey) {
      const conflict = shortcuts.find(s => s.id !== id && s.key === newKey);
      if (conflict) {
        return false; // Conflict found
      }
    }
    
    const updated = shortcuts.map(s => 
      s.id === id ? { ...s, key: newKey } : s
    );
    
    this.saveShortcuts(updated);
    return true;
  }

  /**
   * Get a specific shortcut by ID
   */
  static getShortcut(id: string): ShortcutAction | undefined {
    const shortcuts = this.getShortcuts();
    return shortcuts.find(s => s.id === id);
  }

  /**
   * Check if a keyboard event matches a shortcut
   */
  static matchesShortcut(event: KeyboardEvent, shortcutId: string): boolean {
    const shortcut = this.getShortcut(shortcutId);
    if (!shortcut || !shortcut.key) return false;

    return this.eventMatchesKey(event, shortcut.key);
  }

  /**
   * Check if a keyboard event matches a key string
   */
  static eventMatchesKey(event: KeyboardEvent, keyString: string): boolean {
    const parts = keyString.split('+').map(p => p.trim().toLowerCase());
    
    const ctrl = parts.includes('ctrl') || parts.includes('cmd');
    const shift = parts.includes('shift');
    const alt = parts.includes('alt');
    const key = parts[parts.length - 1]; // Last part is the key
    
    const isMod = event.ctrlKey || event.metaKey;
    
    // Check modifiers match
    if (ctrl && !isMod) return false;
    if (!ctrl && isMod) return false;
    if (shift && !event.shiftKey) return false;
    if (!shift && event.shiftKey && key !== 'shift') return false;
    if (alt && !event.altKey) return false;
    if (!alt && event.altKey) return false;
    
    // Check key matches
    return event.key.toLowerCase() === key.toLowerCase();
  }

  /**
   * Format key string for display (replace Ctrl with Cmd on Mac)
   */
  static formatKeyForDisplay(keyString: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if (isMac) {
      return keyString.replace('Ctrl', 'Cmd');
    }
    return keyString;
  }

  /**
   * Parse keyboard event to key string
   */
  static eventToKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    
    // Handle special keys
    let key = event.key;
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();
    
    // Don't add modifier keys themselves as the final key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      parts.push(key);
    }
    
    return parts.join('+');
  }

  /**
   * Get shortcuts grouped by category
   */
  static getShortcutsByCategory(): Record<string, ShortcutAction[]> {
    const shortcuts = this.getShortcuts();
    const grouped: Record<string, ShortcutAction[]> = {
      editor: [],
      file: [],
      navigation: [],
      session: []
    };
    
    shortcuts.forEach(shortcut => {
      grouped[shortcut.category].push(shortcut);
    });
    
    return grouped;
  }

  /**
   * Validate a key string
   */
  static isValidKeyString(keyString: string): boolean {
    if (!keyString || keyString.trim() === '') return false;
    
    const parts = keyString.split('+').map(p => p.trim());
    if (parts.length === 0) return false;
    
    // Must have at least one non-modifier key
    const nonModifiers = parts.filter(p => 
      !['Ctrl', 'Cmd', 'Shift', 'Alt'].includes(p)
    );
    
    return nonModifiers.length === 1;
  }
}