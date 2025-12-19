import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { marked } from "marked";

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
    fileName: string;
    isPreviewMode: boolean;
    hasUnsavedChanges: boolean;
    onTogglePreview: () => void;
}

export interface EditorRef {
    focus: () => void;
}

const Editor = forwardRef<EditorRef, EditorProps>(({
    content,
    onChange,
    fileName,
    isPreviewMode,
    hasUnsavedChanges,
    onTogglePreview
}, ref) => {
    const [currentLine, setCurrentLine] = useState(1);
    const [visualLineNumbers, setVisualLineNumbers] = useState<JSX.Element[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>();

    useImperativeHandle(ref, () => ({
        focus: () => {
            if (textareaRef.current && !isPreviewMode) {
                textareaRef.current.focus();
            }
        }
    }));

    const lines = content.split('\n');
    const lineCount = lines.length;

    // Calculate visual line numbers accounting for text wrapping
    const calculateVisualLineNumbers = useCallback(() => {
        if (!textareaRef.current || !measureRef.current) {
            console.log('Missing refs, skipping calculation');
            return;
        }

        const textarea = textareaRef.current;
        const measureDiv = measureRef.current;

        // Get computed styles from textarea
        const styles = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(styles.lineHeight);
        const paddingLeft = parseFloat(styles.paddingLeft);
        const paddingRight = parseFloat(styles.paddingRight);
        const width = textarea.clientWidth - paddingLeft - paddingRight;

        if (width <= 0 || lineHeight <= 0) {
            console.log('Invalid dimensions, skipping calculation');
            return;
        }

        // Apply same styles to measure div
        measureDiv.style.font = styles.font;
        measureDiv.style.fontSize = styles.fontSize;
        measureDiv.style.fontFamily = styles.fontFamily;
        measureDiv.style.lineHeight = styles.lineHeight;
        measureDiv.style.letterSpacing = styles.letterSpacing;
        measureDiv.style.wordSpacing = styles.wordSpacing;
        measureDiv.style.width = `${width}px`;
        measureDiv.style.whiteSpace = 'pre-wrap';
        measureDiv.style.wordWrap = 'break-word';
        measureDiv.style.overflowWrap = 'break-word';

        const lineElements: JSX.Element[] = [];
        const logicalLines = content.split('\n');

        logicalLines.forEach((line, logicalIndex) => {
            // Measure this line
            measureDiv.textContent = line || ' '; // Empty lines need space
            const height = measureDiv.offsetHeight;
            const visualLines = Math.max(1, Math.round(height / lineHeight));

            // First visual line shows the line number
            lineElements.push(
                <div
                    key={`${logicalIndex}-0`}
                    className={`line-number ${logicalIndex + 1 === currentLine ? 'current' : ''}`}
                    style={{ height: `${lineHeight}px` }}
                >
                    {logicalIndex + 1}
                </div>
            );

            // Additional visual lines (wrapped) are empty
            for (let i = 1; i < visualLines; i++) {
                lineElements.push(
                    <div
                        key={`${logicalIndex}-${i}`}
                        className="line-number line-number-wrapped"
                        style={{ height: `${lineHeight}px` }}
                    />
                );
            }
        });

        setVisualLineNumbers(lineElements);
    }, [content, currentLine]); // Add dependencies

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        onChange(e.target.value);
    };

    const wrapSelection = (before: string, after: string): void => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);

        // Check if already wrapped (for toggling)
        const beforeLen = before.length;
        const afterLen = after.length;
        const textBefore = textarea.value.substring(start - beforeLen, start);
        const textAfter = textarea.value.substring(end, end + afterLen);

        const isAlreadyWrapped = textBefore === before && textAfter === after;

        if (isAlreadyWrapped) {
            // Remove the wrapping
            const newText =
                textarea.value.substring(0, start - beforeLen) +
                selectedText +
                textarea.value.substring(end + afterLen);
            onChange(newText);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start - beforeLen, end - beforeLen);
            }, 0);
        } else if (selectedText) {
            // Wrap selected text
            const newText = beforeText + before + selectedText + after + afterText;
            onChange(newText);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + before.length, end + before.length);
            }, 0);
        } else {
            // Insert markers and place cursor between
            const newText = beforeText + before + after + afterText;
            onChange(newText);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + before.length, start + before.length);
            }, 0);
        }
    };

    const handleIndent = (increase: boolean): void => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        // Find line boundaries
        const beforeStart = value.lastIndexOf('\n', start - 1) + 1;
        const afterEnd = value.indexOf('\n', end);
        const lineEnd = afterEnd === -1 ? value.length : afterEnd;

        const selectedLines = value.substring(beforeStart, lineEnd);
        const lines = selectedLines.split('\n');

        const modifiedLines = lines.map(line => {
            if (increase) {
                return '    ' + line; // Add 4 spaces
            } else {
                // Remove up to 4 spaces
                return line.replace(/^    /, '') || line.replace(/^  /, '') || line.replace(/^ /, '');
            }
        });

        const newSelectedText = modifiedLines.join('\n');
        const newText = value.substring(0, beforeStart) + newSelectedText + value.substring(lineEnd);

        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            const offset = increase ? 4 : -4;
            textarea.setSelectionRange(
                Math.max(beforeStart, start + offset),
                Math.max(beforeStart, end + offset * lines.length)
            );
        }, 0);
    };

    const addHeading = (level: number): void => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const value = textarea.value;

        // Find start of current line
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', start);
        const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;

        const currentLine = value.substring(lineStart, actualLineEnd);
        const prefix = '#'.repeat(level) + ' ';

        // Remove existing heading markers if any
        const cleanedLine = currentLine.replace(/^#+\s*/, '');
        const newLine = prefix + cleanedLine;

        const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
        }, 0);
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        const isMod = e.ctrlKey || e.metaKey;

        // Bold
        if (isMod && e.key === 'b') {
            e.preventDefault();
            wrapSelection('**', '**');
        }
        // Italic
        else if (isMod && e.key === 'i') {
            e.preventDefault();
            wrapSelection('*', '*');
        }
        // Code
        else if (isMod && e.key === 'k') {
            e.preventDefault();
            wrapSelection('`', '`');
        }
        // Strikethrough
        else if (isMod && e.key === 'u') {
            e.preventDefault();
            wrapSelection('~~', '~~');
        }
        // Tab - indent
        else if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            handleIndent(true);
        }
        // Shift+Tab - unindent
        else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            handleIndent(false);
        }
        // Heading 1
        else if (isMod && e.key === '1') {
            e.preventDefault();
            addHeading(1);
        }
        // Heading 2
        else if (isMod && e.key === '2') {
            e.preventDefault();
            addHeading(2);
        }
        // Heading 3
        else if (isMod && e.key === '3') {
            e.preventDefault();
            addHeading(3);
        }
    };

    const updateCurrentLine = (): void => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
            const lineNumber = textBeforeCursor.split('\n').length;
            setCurrentLine(lineNumber);
        }
    };

    const handleScroll = (): void => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Recalculate visual line numbers when content or currentLine changes
    useEffect(() => {
        calculateVisualLineNumbers();
    }, [calculateVisualLineNumbers]);

    // Handle window resize with debounce
    useEffect(() => {
        const handleResize = () => {
            // Clear any pending timeout
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            // Wait for layout to settle, then recalculate
            resizeTimeoutRef.current = setTimeout(() => {
                // Use requestAnimationFrame to ensure DOM has updated
                requestAnimationFrame(() => {
                    calculateVisualLineNumbers();
                });
            }, 150); // 150ms debounce
        };

        window.addEventListener('resize', handleResize);

        // Initial calculation after mount
        setTimeout(() => {
            calculateVisualLineNumbers();
        }, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, [calculateVisualLineNumbers]);

    const renderMarkdown = (): string => {
        try {
            return marked(content) as string;
        } catch (error) {
            return '<p>Error rendering markdown</p>';
        }
    };

    if (isPreviewMode) {
        return (
            <main className="editor">
                <div className="editor-header">
                    <span className="editor-filename">{fileName || 'Untitled'}</span>
                    {hasUnsavedChanges && <span className="unsaved-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-danger)">
                            <circle cx="12" cy="12" r="12" />
                        </svg>
                    </span>}
                    {fileName && (
                        <button
                            className="toggle-preview-btn"
                            onClick={onTogglePreview}
                            title="View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="markdown-preview">
                    <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="editor">
            <div className="editor-header">
                <span className="editor-filename">{fileName || 'Untitled'}</span>
                {hasUnsavedChanges && <span className="unsaved-indicator">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-danger)">
                        <circle cx="12" cy="12" r="12" />
                    </svg>
                </span>}
                {fileName && (
                    <button
                        className="toggle-preview-btn"
                        onClick={onTogglePreview}
                        title="Edit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                            <path d="M12.014 6.54s2.147-3.969 3.475-6.54l8.511 8.511c-2.583 1.321-6.556 3.459-6.556 3.459l-5.43-5.43zm-8.517 6.423s-1.339 5.254-3.497 8.604l.827.826 3.967-3.967c.348-.348.569-.801.629-1.288.034-.27.153-.532.361-.74.498-.498 1.306-.498 1.803 0 .498.499.498 1.305 0 1.803-.208.209-.469.328-.74.361-.488.061-.94.281-1.288.63l-3.967 3.968.826.84c3.314-2.133 8.604-3.511 8.604-3.511l4.262-7.837-3.951-3.951-7.836 4.262z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="editor-container">
                <div className="line-numbers" ref={lineNumbersRef}>
                    {visualLineNumbers}
                </div>
                <div className="editor-textarea-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="text-editor"
                        value={content}
                        onChange={handleTextChange}
                        onKeyDown={handleEditorKeyDown}
                        onKeyUp={updateCurrentLine}
                        onClick={updateCurrentLine}
                        onScroll={handleScroll}
                        spellCheck={false}
                        placeholder="Start typing..."
                    />
                </div>
                {/* Hidden div for measuring text */}
                <div
                    ref={measureRef}
                    className="line-measure"
                    style={{
                        position: 'absolute',
                        visibility: 'hidden',
                        pointerEvents: 'none',
                        top: '-9999px',
                        left: '-9999px'
                    }}
                />
            </div>
        </main>
    );
});

Editor.displayName = 'Editor';

export default Editor;