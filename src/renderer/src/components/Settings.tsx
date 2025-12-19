import React, { useState, useEffect } from 'react';
import { AIConfigManager, SavedProvider } from '../ai/AIConfigManager';
import { reloadAIEvaluator } from '../ai/AIEvaluator';
import { ShortcutManager, ShortcutAction } from '../utils/shortcutManager';
import ConfirmModal from './ConfirmModal';
import AlertModal from './AlertModal';
import MetricsExport from './MetricsExport';

interface SettingsProps {
    folderPath: string;
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ folderPath, onClose }) => {
    const [activeTab, setActiveTab] = useState<'ai' | 'shortcuts' | 'export'>('ai');

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

    // Shortcuts state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_shortcuts, setShortcuts] = useState<ShortcutAction[]>([]);
    const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [conflictError, setConflictError] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [shortcutToReset, setShortcutToReset] = useState<string | null>(null);

    useEffect(() => {
        loadProviders();
        const config = AIConfigManager.getConfig();
        if (config) {
            setEnabled(config.enabled);
        }
        loadShortcuts();
    }, []);

    const loadProviders = () => {
        const providers = AIConfigManager.getSavedProviders();
        setSavedProviders(providers);

        const active = AIConfigManager.getActiveProvider();
        setActiveProviderId(active?.id || null);
    };

    const loadShortcuts = () => {
        const loadedShortcuts = ShortcutManager.getShortcuts();
        setShortcuts(loadedShortcuts);
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
        const config = AIConfigManager.getConfig();
        if (config) {
            AIConfigManager.saveConfig({ ...config, enabled: newEnabled });
        }
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

    // Shortcut handlers
    const handleEditShortcut = (id: string) => {
        setEditingShortcut(id);
        setIsRecording(true);
        setConflictError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, shortcutId: string) => {
        if (!isRecording) return;

        e.preventDefault();
        e.stopPropagation();

        // Handle Escape to cancel
        if (e.key === 'Escape') {
            handleCancelEdit();
            return;
        }

        // Ignore just modifier keys
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            return;
        }

        const keyString = ShortcutManager.eventToKeyString(e.nativeEvent as KeyboardEvent);

        if (!ShortcutManager.isValidKeyString(keyString)) {
            setConflictError('Invalid key combination');
            return;
        }

        const success = ShortcutManager.updateShortcut(shortcutId, keyString);

        if (success) {
            loadShortcuts();
            setEditingShortcut(null);
            setIsRecording(false);
            setConflictError(null);
        } else {
            setConflictError('This key combination is already in use');
        }
    };

    const handleCancelEdit = () => {
        setEditingShortcut(null);
        setIsRecording(false);
        setConflictError(null);
    };

    const handleResetShortcut = (id: string) => {
        setShortcutToReset(id);
        setShowResetConfirm(true);
    };

    const confirmResetShortcut = () => {
        if (shortcutToReset) {
            ShortcutManager.resetShortcut(shortcutToReset);
            loadShortcuts();
        }
        setShowResetConfirm(false);
        setShortcutToReset(null);
    };

    const handleResetAllShortcuts = () => {
        if (window.confirm('Are you sure you want to reset all shortcuts to their defaults?')) {
            ShortcutManager.resetToDefaults();
            loadShortcuts();
        }
    };

    const getCategoryName = (category: string): string => {
        switch (category) {
            case 'editor': return 'Editor';
            case 'file': return 'File Management';
            case 'navigation': return 'Navigation';
            case 'session': return 'Flashcard Session';
            default: return category;
        }
    };

    const groupedShortcuts = ShortcutManager.getShortcutsByCategory();

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

            <ConfirmModal
                isOpen={showResetConfirm}
                title="Reset Shortcut"
                message="Are you sure you want to reset this shortcut to its default?"
                confirmText="Reset"
                cancelText="Cancel"
                onConfirm={confirmResetShortcut}
                onCancel={() => setShowResetConfirm(false)}
                variant="default"
            />

            <AlertModal
                isOpen={showSaveAlert}
                title="Provider Saved"
                message="Your AI provider has been saved successfully."
                onClose={() => setShowSaveAlert(false)}
            />

            <div className="flashcard-session-container">
                <div className="flashcard-modal settings-modal">
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
                        <button
                            className={`settings-tab ${activeTab === 'export' ? 'active' : ''}`}
                            onClick={() => setActiveTab('export')}
                        >
                            Export Data
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
                        ) : activeTab === 'shortcuts' ? (
                            <div className="settings-content shortcuts-content">
                                <div className="shortcuts-header">
                                    <p className="shortcuts-description">
                                        Click on any shortcut to edit it, then press your desired key combination. Press Escape to cancel.
                                    </p>
                                    <button
                                        className="btn-reset-all"
                                        onClick={handleResetAllShortcuts}
                                    >
                                        Reset All to Defaults
                                    </button>
                                </div>

                                {conflictError && (
                                    <div className="shortcut-error">
                                        {conflictError}
                                    </div>
                                )}

                                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                                    categoryShortcuts.length > 0 && (
                                        <div key={category} className="shortcut-category">
                                            <h3>{getCategoryName(category)}</h3>
                                            <div className="shortcuts-list">
                                                {categoryShortcuts.map(shortcut => (
                                                    <div key={shortcut.id} className="shortcut-item">
                                                        <div className="shortcut-info">
                                                            <span className="shortcut-name">{shortcut.name}</span>
                                                            <span className="shortcut-description">{shortcut.description}</span>
                                                        </div>
                                                        <div className="shortcut-controls">
                                                            {editingShortcut === shortcut.id ? (
                                                                <>
                                                                    <input
                                                                        type="text"
                                                                        className="shortcut-input recording"
                                                                        value={isRecording ? 'Press keys...' : shortcut.key}
                                                                        onKeyDown={(e) => handleKeyDown(e, shortcut.id)}
                                                                        autoFocus
                                                                        readOnly
                                                                    />
                                                                    <button
                                                                        className="btn-cancel-shortcut"
                                                                        onClick={handleCancelEdit}
                                                                        title="Cancel"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                                                            <path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                                                                        </svg>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <kbd
                                                                        className="shortcut-key"
                                                                        onClick={() => handleEditShortcut(shortcut.id)}
                                                                        title="Click to edit"
                                                                    >
                                                                        {ShortcutManager.formatKeyForDisplay(shortcut.key)}
                                                                    </kbd>
                                                                    {shortcut.key !== shortcut.defaultKey && (
                                                                        <button
                                                                            className="btn-reset-shortcut"
                                                                            onClick={() => handleResetShortcut(shortcut.id)}
                                                                            title="Reset to default"
                                                                        >
                                                                            ↺
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="settings-content">
                                <MetricsExport folderPath={folderPath} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;