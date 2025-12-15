import React, { useState, useEffect } from "react";
import FileTree from "./FileTree";
import SessionsList from "./SessionsList";
import FolderSelectorModal from "./FolderSelectorModal";
import ConfirmModal from "./ConfirmModal";

interface SidebarProps {
    onFileSelect: (filePath: string, fileName: string) => void;
    selectedFile: string | null;
    folderPath: string | null;
    onFolderChange: (folderPath: string) => void;
    onNewFile: (filePath: string, fileName: string) => void;
    onDeleteFile: () => void;
    currentFile: string | null;
    onSessionsToggle: (sessionPath: string) => void;
    onFilesChange: (files: { name: string; path: string }[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    onFileSelect,
    selectedFile,
    folderPath,
    onFolderChange,
    onNewFile,
    onDeleteFile,
    currentFile,
    onSessionsToggle,
    onFilesChange
}) => {
    const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [viewMode, setViewMode] = useState<'notes' | 'sessions'>('notes');
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string>("");

    useEffect(() => {
        if (folderPath) {
            loadFiles(folderPath);
        }
    }, [folderPath]);

    const loadFiles = async (path: string): Promise<void> => {
        const mdFiles = await window.api.readMdFiles(path);
        setFiles(mdFiles);
        onFilesChange(mdFiles);
    };

    const handleSelectFolder = () => {
        setShowFolderModal(true);
    };

    const handleFolderSelected = (selectedPath: string) => {
        onFolderChange(selectedPath);
        setShowFolderModal(false);
    };

    const handleCreateFile = async (): Promise<void> => {
        if (!folderPath || !newFileName.trim()) return;

        const result = await window.api.createFile(folderPath, newFileName);
        if (result.success && result.path) {
            await loadFiles(folderPath);
            const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
            onNewFile(result.path, fileName);
            setNewFileName("");
            setIsCreating(false);
        } else {
            alert(result.error || 'Failed to create file');
        }
    };

    const handleDeleteClick = (): void => {
        if (!currentFile) return;
        const fileName = currentFile.split('/').pop() || '';
        setFileToDelete(fileName);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async (): Promise<void> => {
        if (!currentFile) return;

        const success = await window.api.deleteFile(currentFile);
        if (success) {
            if (folderPath) {
                await loadFiles(folderPath);
            }
            onDeleteFile();
        } else {
            alert('Failed to delete file');
        }

        setShowDeleteConfirm(false);
        setFileToDelete("");

        setTimeout(() => {
            const textarea = document.querySelector('.text-editor') as HTMLTextAreaElement;
            if (textarea) {
                textarea.blur();
                setTimeout(() => textarea.focus(), 10);
            }
        }, 150);
    };

    const folderName = folderPath ? folderPath.split('/').pop() || folderPath : "No folder selected";

    return (
        <>
            {showFolderModal && (
                <FolderSelectorModal
                    onSelect={handleFolderSelected}
                    onClose={() => setShowFolderModal(false)}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete File"
                message={`Are you sure you want to delete "${fileToDelete}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                variant="danger"
            />

            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="folder-header-inline">
                        <span className="folder-name">{folderName}</span>
                        <button
                            className="select-folder-btn"
                            onClick={handleSelectFolder}
                        >
                            Select
                        </button>
                    </div>

                    {folderPath && !isCreating && (
                        <div className="file-actions">
                            <button
                                className="action-btn create-btn"
                                onClick={() => setIsCreating(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                    <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
                                </svg>
                                {" New"}
                            </button>
                            {currentFile && (
                                <button
                                    className="action-btn delete-btn"
                                    onClick={handleDeleteClick}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                        <path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                                    </svg>
                                    {" Delete"}
                                </button>
                            )}
                            <button
                                className="view-mode-toggle-btn"
                                onClick={() => setViewMode(prev => prev === 'notes' ? 'sessions' : 'notes')}
                            >
                                {viewMode === 'notes' ? 'Notes' : 'Sessions'}
                            </button>
                        </div>
                    )}

                    {folderPath && isCreating && (
                        <div className="create-file-form">
                            <input
                                type="text"
                                className="new-file-input"
                                placeholder="file.name.md"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateFile();
                                    } else if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setNewFileName("");
                                    }
                                }}
                                autoFocus
                            />
                            <div className="create-file-buttons">
                                <button
                                    className="action-btn create-confirm-btn"
                                    onClick={handleCreateFile}
                                    title="Create file"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                        <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                                    </svg>
                                </button>
                                <button
                                    className="action-btn create-cancel-btn"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewFileName("");
                                    }}
                                    title="Cancel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                                        <path d="M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sidebar-content">
                    {viewMode === 'notes' ? (
                        <>
                            {files.length > 0 ? (
                                <FileTree
                                    files={files}
                                    onFileClick={onFileSelect}
                                    selectedFile={selectedFile}
                                />
                            ) : (
                                <p className="no-files">No markdown files found</p>
                            )}
                        </>
                    ) : (
                        <div className="sessions-content">
                            {folderPath ? (
                                <SessionsList
                                    folderPath={folderPath}
                                    selectedSession={currentFile}
                                    onSessionSelect={(path: string) => {
                                        console.log('Session selected:', path);
                                        onSessionsToggle(path);
                                    }}
                                />
                            ) : (
                                <p className="no-sessions-hint">Select a folder</p>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;