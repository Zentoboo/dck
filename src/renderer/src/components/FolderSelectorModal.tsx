import React, { useState, useEffect } from 'react';
import { FolderManager, RecentFolder } from '../utils/folderManager';

interface FolderSelectorModalProps {
    onSelect: (folderPath: string) => void;
    onClose: () => void;
}

const FolderSelectorModal: React.FC<FolderSelectorModalProps> = ({ onSelect, onClose }) => {
    const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

    useEffect(() => {
        setRecentFolders(FolderManager.getRecentFolders());
    }, []);

    const handleSelectNew = async () => {
        const selected = await window.api.selectFolder();
        if (selected) {
            FolderManager.addFolder(selected);
            onSelect(selected);
        }
    };

    const handleSelectRecent = (path: string) => {
        FolderManager.addFolder(path); // Update last accessed time
        onSelect(path);
    };

    const handleRemoveRecent = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        FolderManager.removeFolder(path);
        setRecentFolders(FolderManager.getRecentFolders());
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-dialog folder-selector-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Select Folder</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                            <path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                        </svg>
                    </button>
                </div>

                <div className="modal-content">
                    <div className="folder-selector-section">
                        <button
                            className="btn-primary btn-browse-folder"
                            onClick={handleSelectNew}
                        >
                            Browse for Folder...
                        </button>
                    </div>

                    {recentFolders.length > 0 && (
                        <div className="folder-selector-section">
                            <h3>Recent Folders</h3>
                            <div className="recent-folders-list">
                                {recentFolders.map((folder) => (
                                    <div
                                        key={folder.path}
                                        className="recent-folder-item"
                                        onClick={() => handleSelectRecent(folder.path)}
                                    >
                                        <div className="folder-info">
                                            <div className="folder-name">{folder.name}</div>
                                            <div className="folder-path">{folder.path}</div>
                                            <div className="folder-time">{FolderManager.formatTimestamp(folder.lastAccessed)}</div>
                                        </div>
                                        <button
                                            className="btn-remove-folder"
                                            onClick={(e) => handleRemoveRecent(folder.path, e)}
                                            title="Remove from recent"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                                <path d="M0 10h24v4h-24z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FolderSelectorModal;