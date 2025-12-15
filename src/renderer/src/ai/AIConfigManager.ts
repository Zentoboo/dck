import { AIProviderConfig } from './AIProvider';

const CONFIG_KEY = 'ai-config';
const PROVIDERS_KEY = 'ai-providers';

export interface SavedProvider {
  id: string;
  providerId: string;
  name: string;
  apiKey: string;
}

export class AIConfigManager {
  /**
   * Get currently active AI configuration
   */
  static getConfig(): AIProviderConfig | null {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load AI config:', error);
      return null;
    }
  }

  /**
   * Save currently active AI configuration
   */
  static saveConfig(config: AIProviderConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save AI config:', error);
      throw new Error('Failed to save AI configuration');
    }
  }

  /**
   * Clear active AI configuration
   */
  static clearConfig(): void {
    localStorage.removeItem(CONFIG_KEY);
  }

  /**
   * Get all saved providers
   */
  static getSavedProviders(): SavedProvider[] {
    try {
      const stored = localStorage.getItem(PROVIDERS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load saved providers:', error);
      return [];
    }
  }

  /**
   * Save a provider configuration
   */
  static saveProvider(provider: SavedProvider): void {
    try {
      const providers = this.getSavedProviders();
      const existingIndex = providers.findIndex(p => p.id === provider.id);
      
      if (existingIndex >= 0) {
        providers[existingIndex] = provider;
      } else {
        providers.push(provider);
      }
      
      localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
    } catch (error) {
      console.error('Failed to save provider:', error);
      throw new Error('Failed to save provider configuration');
    }
  }

  /**
   * Delete a saved provider
   */
  static deleteProvider(id: string): void {
    try {
      const providers = this.getSavedProviders();
      const filtered = providers.filter(p => p.id !== id);
      localStorage.setItem(PROVIDERS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete provider:', error);
      throw new Error('Failed to delete provider');
    }
  }

  /**
   * Activate a saved provider
   */
  static activateProvider(id: string): boolean {
    try {
      const providers = this.getSavedProviders();
      const provider = providers.find(p => p.id === id);
      
      if (!provider) return false;
      
      this.saveConfig({
        providerId: provider.providerId,
        apiKey: provider.apiKey,
        enabled: true
      });
      
      return true;
    } catch (error) {
      console.error('Failed to activate provider:', error);
      return false;
    }
  }

  /**
   * Check if AI is configured and enabled
   */
  static isConfigured(): boolean {
    const config = this.getConfig();
    return config !== null && config.enabled && !!config.apiKey;
  }

  /**
   * Get the current provider ID
   */
  static getProviderId(): string | null {
    const config = this.getConfig();
    return config?.providerId || null;
  }

  /**
   * Get the currently active provider from saved list
   */
  static getActiveProvider(): SavedProvider | null {
    const config = this.getConfig();
    if (!config || !config.apiKey) return null;
    
    const providers = this.getSavedProviders();
    return providers.find(p => 
      p.providerId === config.providerId && 
      p.apiKey === config.apiKey
    ) || null;
  }
}