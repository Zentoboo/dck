import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import FlashcardSession from "./components/FlashcardSession";
import StatsDashboard from "./components/StatsDashboard";
import Settings from "./components/Settings";
import Guide from "./components/Guide";
import ConfirmModal from "./components/ConfirmModal";
import { FolderManager } from "./utils/folderManager";
import { ShortcutManager } from "./utils/shortcutManager";

const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [showFlashcardSession, setShowFlashcardSession] = useState<boolean>(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const editorRef = useRef<{ focus: () => void } | null>(null);

  // Modal state for unsaved changes
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showGuideOnStartup, setShowGuideOnStartup] = useState(false);

  // Auto-load last folder on app start
  useEffect(() => {
    const lastFolder = FolderManager.getLastFolder();
    if (lastFolder) {
      setFolderPath(lastFolder.path);
    }
  }, []);

  // Check if guide should be shown on startup
  useEffect(() => {
    const dontShowGuide = localStorage.getItem('dontShowGuide');
    if (dontShowGuide !== 'true') {
      // Show guide on first launch or if user hasn't opted out
      setShowGuideOnStartup(true);
      setShowGuide(true);
    }
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(fileContent !== originalContent);
  }, [fileContent, originalContent]);

  const handleUnsavedChanges = (action: () => void) => {
    if (hasUnsavedChanges && currentFile) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  const handleSaveAndContinue = async () => {
    if (currentFile) {
      await window.api.writeFile(currentFile, fileContent);
      setOriginalContent(fileContent);
    }
    setShowUnsavedModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleDiscardAndContinue = () => {
    setShowUnsavedModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const loadFile = async (filePath: string, fileName: string): Promise<void> => {
    const doLoad = async () => {
      const content = await window.api.readFile(filePath);
      setCurrentFile(filePath);
      setCurrentFileName(fileName);
      setFileContent(content);
      setOriginalContent(content);

      // Restore focus to editor (blur/focus trick for Electron)
      setTimeout(() => {
        if (editorRef.current?.focus) {
          const textarea = document.querySelector('.text-editor') as HTMLTextAreaElement;
          if (textarea) {
            textarea.blur();
            setTimeout(() => textarea.focus(), 10);
          }
        }
      }, 150);
    };

    handleUnsavedChanges(doLoad);
  };

  const handleContentChange = (content: string): void => {
    setFileContent(content);
  };

  const handleFolderChange = async (newFolderPath: string): Promise<void> => {
    const doChange = () => {
      setFolderPath(newFolderPath);
      setCurrentFile(null);
      setCurrentFileName("");
      setFileContent("");
      setOriginalContent("");

      // Restore focus to editor (blur/focus trick for Electron)
      setTimeout(() => {
        const textarea = document.querySelector('.text-editor') as HTMLTextAreaElement;
        if (textarea) {
          textarea.blur();
          setTimeout(() => textarea.focus(), 10);
        }
      }, 150);
    };

    handleUnsavedChanges(doChange);
  };

  const handleNewFile = (filePath: string, fileName: string): void => {
    setCurrentFile(filePath);
    setCurrentFileName(fileName);
    setFileContent("");
    setOriginalContent("");
  };

  const handleDeleteFile = (): void => {
    setCurrentFile(null);
    setCurrentFileName("");
    setFileContent("");
    setOriginalContent("");
  };

  const togglePreviewMode = (): void => {
    setIsPreviewMode(prev => !prev);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
      // Don't trigger shortcuts when typing in input fields (except editor textarea)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
        return;
      }

      // Save file (Ctrl/Cmd + S)
      if (ShortcutManager.matchesShortcut(e, 'editor.save')) {
        e.preventDefault();
        if (currentFile && hasUnsavedChanges) {
          const success = await window.api.writeFile(currentFile, fileContent);
          if (success) {
            setOriginalContent(fileContent);
            console.log('File saved successfully');
          }
        }
        return;
      }

      // Toggle preview (Ctrl/Cmd + P)
      if (ShortcutManager.matchesShortcut(e, 'editor.togglePreview')) {
        e.preventDefault();
        if (!showFlashcardSession && !showStatsDashboard && !showSettings && !showGuide) {
          setIsPreviewMode(prev => !prev);
        }
        return;
      }

      // Open Settings (Ctrl/Cmd + ,)
      if (ShortcutManager.matchesShortcut(e, 'nav.settings')) {
        e.preventDefault();
        setShowSettings(true);
        setShowFlashcardSession(false);
        setShowStatsDashboard(false);
        setShowGuide(false);
        setShowGuideOnStartup(false);
        return;
      }

      // Open Guide (Ctrl/Cmd + /)
      if (ShortcutManager.matchesShortcut(e, 'nav.guide')) {
        e.preventDefault();
        setShowGuide(true);
        setShowFlashcardSession(false);
        setShowStatsDashboard(false);
        setShowSettings(false);
        setShowGuideOnStartup(false);
        return;
      }

      // Start flashcard session (Ctrl/Cmd + F)
      if (ShortcutManager.matchesShortcut(e, 'session.start')) {
        e.preventDefault();
        if (folderPath && files.length > 0) {
          setShowFlashcardSession(true);
          setShowStatsDashboard(false);
          setShowSettings(false);
          setShowGuide(false);
        }
        return;
      }

      // View statistics (Ctrl/Cmd + E)
      if (ShortcutManager.matchesShortcut(e, 'session.stats')) {
        e.preventDefault();
        if (folderPath) {
          setShowStatsDashboard(true);
          setShowFlashcardSession(false);
          setShowSettings(false);
          setShowGuide(false);
        }
        return;
      }

      // New file (Ctrl/Cmd + N)
      if (ShortcutManager.matchesShortcut(e, 'file.new')) {
        e.preventDefault();
        if (folderPath) {
          // Trigger new file creation in sidebar
          const createBtn = document.querySelector('.create-btn') as HTMLButtonElement;
          if (createBtn) {
            createBtn.click();
          }
        }
        return;
      }

      // Delete file (Ctrl/Cmd + D)
      if (ShortcutManager.matchesShortcut(e, 'file.delete')) {
        e.preventDefault();
        if (currentFile) {
          const deleteBtn = document.querySelector('.delete-btn') as HTMLButtonElement;
          if (deleteBtn) {
            deleteBtn.click();
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, fileContent, hasUnsavedChanges, folderPath, files, showFlashcardSession, showStatsDashboard, showSettings, showGuide, isPreviewMode]);

  return (
    <>
      <ConfirmModal
        isOpen={showUnsavedModal}
        title="Unsaved Changes"
        message={`You have unsaved changes in "${currentFileName}". What would you like to do?`}
        confirmText="Save Changes"
        cancelText="Discard Changes"
        onConfirm={handleSaveAndContinue}
        onCancel={handleDiscardAndContinue}
        variant="default"
      />

      <div className="app">
        <header className="header">
          <h1 className="title">dck</h1>
          <div className="tools-content" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {folderPath && files.length > 0 && (
              <>
                <button
                  className={`toggle-preview-btn ${showFlashcardSession ? 'active' : ''}`}
                  onClick={() => {
                    console.log('Flashcard button clicked, files:', files.length);
                    setShowFlashcardSession(!showFlashcardSession);
                    setShowStatsDashboard(false);
                    setShowSettings(false);
                    setShowGuide(false);
                  }}
                  title="Flashcard Session"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
                    <path fill="currentColor" d="M1 12.155c2.256 3.97 4.55 7.918 6.879 11.845h-5.379c-.829 0-1.5-.675-1.5-1.5v-10.345zm2.85.859c3.278 1.952 12.866 7.658 13.121 7.805l-5.162 2.98c-.231.132-.49.201-.751.201-.549 0-1.037-.298-1.299-.75l-5.909-10.236zm1.9-12.813c-.23-.133-.489-.201-.75-.201-.524 0-1.026.277-1.299.75l-3.5 6.062c-.133.23-.201.489-.201.749 0 .527.278 1.028.75 1.3 2.936 1.695 14.58 8.7 17.516 10.396.718.413 1.633.168 2.048-.55l3.5-6.062c.133-.23.186-.488.186-.749 0-.52-.257-1.025-.734-1.3l-17.516-10.395m.25 3.944c1.104 0 2 .896 2 2s-.896 2-2 2-2-.896-2-2 .896-2 2-2" />
                  </svg>
                </button>
                <button
                  className={`toggle-preview-btn ${showStatsDashboard ? 'active' : ''}`}
                  onClick={() => {
                    console.log('Stats button clicked');
                    setShowStatsDashboard(!showStatsDashboard);
                    setShowFlashcardSession(false);
                    setShowSettings(false);
                    setShowGuide(false);
                  }}
                  title="Statistics"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7 19h-6v-11h6v11zm8-18h-6v18h6v-18zm8 11h-6v7h6v-7zm1 9h-24v2h24v-2z" />
                  </svg>
                </button>
              </>
            )}
            <button
              className={`toggle-preview-btn ${showSettings ? 'active' : ''}`}
              onClick={() => {
                console.log('Settings button clicked');
                setShowSettings(!showSettings);
                setShowFlashcardSession(false);
                setShowStatsDashboard(false);
                setShowGuide(false);
              }}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" />
              </svg>
            </button>
            <button
              className={`toggle-preview-btn ${showGuide ? 'active' : ''}`}
              onClick={() => {
                console.log('Guide button clicked');
                setShowGuide(true);
                setShowGuideOnStartup(false);
                setShowSettings(false);
                setShowFlashcardSession(false);
                setShowStatsDashboard(false);
              }}
              title="Guide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1.25 17c0 .69-.559 1.25-1.25 1.25-.689 0-1.25-.56-1.25-1.25s.561-1.25 1.25-1.25c.691 0 1.25.56 1.25 1.25zm1.393-9.998c-.608-.616-1.515-.955-2.551-.955-2.18 0-3.59 1.55-3.59 3.95h2.011c0-1.486.829-2.013 1.538-2.013.634 0 1.307.421 1.364 1.226.062.847-.39 1.277-.962 1.821-1.412 1.343-1.438 1.993-1.432 3.468h2.005c-.013-.664.03-1.203.935-2.178.677-.73 1.519-1.638 1.536-3.022.011-.924-.284-1.719-.854-2.297z" />
              </svg>
            </button>
            {folderPath && files.length === 0 && (
              <p className="no-files-warning" style={{ margin: 0, fontSize: "14px" }}>No markdown files</p>
            )}
          </div>
        </header>
        <div className="body">
          <Sidebar
            onFileSelect={loadFile}
            selectedFile={currentFile}
            folderPath={folderPath}
            onFolderChange={handleFolderChange}
            onNewFile={handleNewFile}
            onDeleteFile={handleDeleteFile}
            currentFile={currentFile}
            onSessionsToggle={(sessionPath: string) => {
              console.log('Session selected:', sessionPath);
              loadFile(sessionPath, sessionPath.split('/').pop() || 'session');
            }}
            onFilesChange={setFiles}
          />
          {!showFlashcardSession && !showStatsDashboard && !showSettings && !showGuide ? (
            <Editor
              ref={editorRef}
              content={fileContent}
              onChange={handleContentChange}
              fileName={currentFileName}
              isPreviewMode={isPreviewMode}
              hasUnsavedChanges={hasUnsavedChanges}
              onTogglePreview={togglePreviewMode}
            />
          ) : showFlashcardSession && folderPath ? (
            <FlashcardSession
              folderPath={folderPath}
              files={files}
              onClose={() => {
                console.log('Closing flashcard session');
                setShowFlashcardSession(false);
                setStatsRefreshKey(prev => prev + 1);
              }}
            />
          ) : showStatsDashboard && folderPath ? (
            <StatsDashboard
              key={statsRefreshKey}
              folderPath={folderPath}
              files={files}
              onClose={() => {
                console.log('Closing stats dashboard');
                setShowStatsDashboard(false);
              }}
            />
          ) : showSettings ? (
            <Settings
              folderPath={folderPath || ''}
              onClose={() => {
                console.log('Closing Settings');
                setShowSettings(false);
              }}
            />
          ) : showGuide ? (
            <Guide
              onClose={() => {
                console.log('Closing Guide');
                setShowGuide(false);
                setShowGuideOnStartup(false);
              }}
              showOnStartup={showGuideOnStartup}
              onDontShowAgain={() => {
                localStorage.setItem('dontShowGuide', 'true');
                setShowGuideOnStartup(false);
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default App;