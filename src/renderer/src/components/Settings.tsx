import React, { useState, useEffect } from 'react';
import { AIConfigManager, SavedProvider } from '../ai/AIConfigManager';
import { reloadAIEvaluator } from '../ai/AIEvaluator';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'shortcuts'>('ai');

    // AI Settings state
    const [enabled, setEnabled] = useState(false);
    const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([]);
    const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newProviderId, setNewProviderId] = useState('claude');
    const [newApiKey, setNewApiKey] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
    const [showSaveAlert, setShowSaveAlert] = useState(false);

    useEffect(() => {
        loadProviders();
        const config = AIConfigManager.getConfig();
        if (config) {
            setEnabled(config.enabled);
        }
    }, []);

    const loadProviders = () => {
        const providers = AIConfigManager.getSavedProviders();
        setSavedProviders(providers);

        const active = AIConfigManager.getActiveProvider();
        setActiveProviderId(active?.id || null);
    };

    const handleAddProvider = () => {
        if (!newName.trim() || !newApiKey.trim()) return;

        const provider: SavedProvider = {
            id: `${newProviderId}-${Date.now()}`,
            providerId: newProviderId,
            name: newName.trim(),
            apiKey: newApiKey.trim()
        };

        AIConfigManager.saveProvider(provider);
        loadProviders();

        setNewName('');
        setNewApiKey('');
        setNewProviderId('claude');
        setShowAddForm(false);
        setShowSaveAlert(true);
    };

    const handleDeleteProvider = (id: string) => {
        setProviderToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (providerToDelete) {
            AIConfigManager.deleteProvider(providerToDelete);
            loadProviders();
        }
        setShowDeleteConfirm(false);
        setProviderToDelete(null);
    };

    const handleSetActive = (id: string) => {
        AIConfigManager.activateProvider(id);
        setActiveProviderId(id);
        reloadAIEvaluator();
    };

    const handleToggleEnabled = (newEnabled: boolean) => {
        AIConfigManager.setEnabled(newEnabled);
        setEnabled(newEnabled);
        reloadAIEvaluator();
    };

    const getProviderDisplayName = (providerId: string): string => {
        switch (providerId) {
            case 'claude': return 'Claude';
            case 'grok': return 'Grok';
            default: return providerId;
        }
    };

    const shortcuts = [
        { category: 'General', key: 'Ctrl/Cmd + S', description: 'Save current file' },
        { category: 'General', key: 'Ctrl/Cmd + P', description: 'Toggle preview mode' },
        { category: 'General', key: 'Escape', description: 'Close modals' },
        { category: 'General', key: 'Enter', description: 'Confirm in modals' },

        { category: 'Formatting', key: 'Ctrl/Cmd + B', description: 'Bold text' },
        { category: 'Formatting', key: 'Ctrl/Cmd + I', description: 'Italic text' },
        { category: 'Formatting', key: 'Ctrl/Cmd + K', description: 'Inline code' },
        { category: 'Formatting', key: 'Ctrl/Cmd + U', description: 'Strikethrough text' },

        { category: 'Headings', key: 'Ctrl/Cmd + 1', description: 'Heading 1' },
        { category: 'Headings', key: 'Ctrl/Cmd + 2', description: 'Heading 2' },
        { category: 'Headings', key: 'Ctrl/Cmd + 3', description: 'Heading 3' },

        { category: 'Indentation', key: 'Tab', description: 'Indent line/selection' },
        { category: 'Indentation', key: 'Shift + Tab', description: 'Unindent line/selection' },
    ];

    return (
        <>
            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Provider"
                message="Are you sure you want to delete this provider? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                variant="danger"
            />

            <AlertModal
                isOpen={showSaveAlert}
                title="Provider Saved"
                message="Your AI provider has been saved successfully."
                onClose={() => setShowSaveAlert(false)}
            />

            <div className="flashcard-session-container">
                <div className="flashcard-modal">
                    <div className="modal-header">
                        <h2>Settings</h2>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>

                    <div className="settings-tabs">
                        <button
                            className={`settings-tab ${activeTab === 'ai' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ai')}
                        >
                            AI Evaluation
                        </button>
                        <button
                            className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shortcuts')}
                        >
                            Keyboard Shortcuts
                        </button>
                    </div>

                    <div className="modal-content">
                        {activeTab === 'ai' ? (
                            <div className="settings-content">
                                <div className="setting-section">
                                    <label className="setting-label">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => handleToggleEnabled(e.target.checked)}
                                            disabled={savedProviders.length === 0}
                                        />
                                        <span>Enable AI Evaluation</span>
                                    </label>
                                    <p className="setting-description">
                                        Get AI-powered feedback on your flashcard answers
                                    </p>
                                </div>

                                <div className="setting-section">
                                    <div className="section-header">
                                        <h3>Saved Providers</h3>
                                        <button
                                            className="btn-add-provider"
                                            onClick={() => setShowAddForm(!showAddForm)}
                                        >
                                            {showAddForm ? (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                                        <path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                                                    </svg>
                                                    Cancel
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                                        <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
                                                    </svg>
                                                    Add Provider
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {showAddForm && (
                                        <div className="add-provider-form">
                                            <input
                                                type="text"
                                                className="setting-input"
                                                placeholder="Name (e.g., My Claude Key)"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                            />
                                            <select
                                                className="setting-select"
                                                value={newProviderId}
                                                onChange={(e) => setNewProviderId(e.target.value)}
                                            >
                                                <option value="claude">Claude</option>
                                                <option value="grok">Grok</option>
                                            </select>
                                            <input
                                                type="password"
                                                className="setting-input"
                                                placeholder="API Key"
                                                value={newApiKey}
                                                onChange={(e) => setNewApiKey(e.target.value)}
                                            />
                                            <button
                                                className="btn-save-provider"
                                                onClick={handleAddProvider}
                                                disabled={!newName.trim() || !newApiKey.trim()}
                                            >
                                                Save Provider
                                            </button>
                                        </div>
                                    )}

                                    {savedProviders.length === 0 ? (
                                        <p className="no-providers-message">
                                            No providers configured. Add one to enable AI evaluation.
                                        </p>
                                    ) : (
                                        <div className="providers-list">
                                            {savedProviders.map(provider => (
                                                <div
                                                    key={provider.id}
                                                    className={`provider-item ${provider.id === activeProviderId ? 'active' : ''}`}
                                                >
                                                    <div className="provider-info">
                                                        <div className="provider-name">{provider.name}</div>
                                                        <div className="provider-type">
                                                            {getProviderDisplayName(provider.providerId)}
                                                        </div>
                                                    </div>
                                                    <div className="provider-actions">
                                                        {provider.id !== activeProviderId && (
                                                            <button
                                                                className="btn-set-active"
                                                                onClick={() => handleSetActive(provider.id)}
                                                            >
                                                                Set Active
                                                            </button>
                                                        )}
                                                        {provider.id === activeProviderId && (
                                                            <span className="active-badge">Active</span>
                                                        )}
                                                        <button
                                                            className="btn-delete-provider"
                                                            onClick={() => handleDeleteProvider(provider.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                                                <path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="settings-content">
                                <div className="shortcuts-list">
                                    <h3>Editor Shortcuts</h3>
                                    {shortcuts.map((shortcut, index) => (
                                        <div key={index} className="shortcut-item">
                                            <kbd className="shortcut-key">{shortcut.key}</kbd>
                                            <span className="shortcut-description">{shortcut.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;