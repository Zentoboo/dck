import React, { useState } from 'react';

interface GuideProps {
    onClose: () => void;
    showOnStartup: boolean;
    onDontShowAgain: () => void;
}

const Guide: React.FC<GuideProps> = ({ onClose, showOnStartup, onDontShowAgain }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const pages = [
        {
            title: 'Welcome to dck!',
            content: (
                <div>
                    <p>dck is an AI-enhanced note-taking and flashcard application that helps you learn more effectively using spaced repetition.</p>
                    <br />
                    <h4>Key Features:</h4>
                    <ul>
                        <li>Write notes in Markdown format</li>
                        <li>Create flashcards directly in your notes</li>
                        <li>AI-powered answer evaluation</li>
                        <li>Spaced repetition using FSRS algorithm</li>
                        <li>Track your learning progress with statistics</li>
                    </ul>
                </div>
            )
        },
        {
            title: 'Creating Flashcards',
            content: (
                <div>
                    <p>Flashcards are created using a simple Q&A format in your markdown files:</p>
                    <br />
                    <h4>Note Format:</h4>
                    <pre className="guide-code">
                        {`- What is photosynthesis? (question)
    - Photosynthesis is ... (answer must be indented)`}
                    </pre>
                    <p><strong>Important:</strong> Right after the question, answer must be indented. Any answer whether its code snippet or basic text or list of texts will be considered as answer as long as its indented.</p>
                    <br />
                    <h4>Flashcard:</h4>
                    <pre className="guide-code">
                        {`Q: What is photosynthesis?
A: Photosynthesis is...`}
                    </pre>
                    <br />
                </div>
            )
        },
        {
            title: 'Markdown Formatting',
            content: (
                <div>
                    <p>You can use standard Markdown formatting in your questions and answers:</p>
                    <br />
                    <h4>Text Formatting:</h4>
                    <ul>
                        <li><strong>Bold:</strong> **text** or Ctrl/Cmd + B</li>
                        <li><em>Italic:</em> *text* or Ctrl/Cmd + I</li>
                        <li><code>Inline code:</code> `code` or Ctrl/Cmd + K</li>
                        <li><del>Strikethrough:</del> ~~text~~ or Ctrl/Cmd + U</li>
                    </ul>
                    <br />
                    <h4>Headings:</h4>
                    <pre className="guide-code">
                        {`# Heading 1 (Ctrl/Cmd + 1)
## Heading 2 (Ctrl/Cmd + 2)
### Heading 3 (Ctrl/Cmd + 3)`}
                    </pre>
                    <br />
                    <h4>Lists:</h4>
                    <pre className="guide-code">
                        {`- Item 1
- Item 2
  - Nested item (Tab to indent)`}
                    </pre>
                </div>
            )
        },
        {
            title: 'Using the Application',
            content: (
                <div>
                    <h4>Getting Started:</h4>
                    <ol>
                        <li><strong>Select Folder:</strong> Choose a folder containing your markdown files</li>
                        <li><strong>Create Notes:</strong> Write your notes with Q&A flashcards</li>
                        <li><strong>Start Learning:</strong> Click the flashcard icon to begin a session</li>
                    </ol>
                    <br />
                    <h4>Header Buttons:</h4>
                    <ul>
                        <li><strong>Flashcard (📚):</strong> Start a learning session</li>
                        <li><strong>Statistics (📊):</strong> View your learning progress</li>
                        <li><strong>Settings (⚙️):</strong> Configure AI evaluation and view shortcuts</li>
                        <li><strong>Guide (?):</strong> Open this guide anytime</li>
                    </ul>
                    <br />
                    <h4>Keyboard Shortcuts:</h4>
                    <p>Press <strong>Ctrl/Cmd + S</strong> to save your work.</p>
                    <p>Press <strong>Ctrl/Cmd + P</strong> to toggle preview mode.</p>
                    <p>View all shortcuts in Settings → Keyboard Shortcuts tab.</p>
                </div>
            )
        },
        {
            title: 'AI Evaluation',
            content: (
                <div>
                    <p>Enable AI-powered evaluation to get intelligent feedback on your answers:</p>
                    <br />
                    <h4>Setup:</h4>
                    <ol>
                        <li>Click the Settings icon (⚙️)</li>
                        <li>Go to "AI Evaluation" tab</li>
                        <li>Click "Add Provider"</li>
                        <li>Enter your API key (Claude or Grok)</li>
                        <li>Enable AI Evaluation</li>
                    </ol>
                    <br />
                    <h4>How It Works:</h4>
                    <p>When you answer a flashcard, the AI will:</p>
                    <ul>
                        <li>Compare your answer to the correct answer</li>
                        <li>Evaluate understanding and accuracy</li>
                        <li>Provide feedback on what you got right/wrong</li>
                        <li>Help you learn from mistakes</li>
                    </ul>
                    <br />
                    <p><strong>Note:</strong> AI evaluation is optional. You can still use the app with manual self-assessment.</p>
                </div>
            )
        },
        {
            title: 'Spaced Repetition',
            content: (
                <div>
                    <p>dck uses the FSRS (Free Spaced Repetition Scheduler) algorithm to optimize your learning:</p>
                    <br />
                    <h4>How It Works:</h4>
                    <ul>
                        <li><strong>New cards:</strong> Cards you haven't reviewed yet</li>
                        <li><strong>Learning:</strong> Cards you're currently learning</li>
                        <li><strong>Review:</strong> Cards you've learned, shown at optimal intervals</li>
                    </ul>
                    <br />
                    <h4>Rating Your Answers:</h4>
                    <ul>
                        <li><strong>Again:</strong> Didn't remember at all → Review soon</li>
                        <li><strong>Hard:</strong> Difficult to remember → Shorter interval</li>
                        <li><strong>Good:</strong> Remembered correctly → Standard interval</li>
                        <li><strong>Easy:</strong> Very easy to remember → Longer interval</li>
                    </ul>
                    <br />
                    <p>The algorithm adjusts intervals based on your performance to maximize retention!</p>
                </div>
            )
        },
        {
            title: 'Tips for Effective Learning',
            content: (
                <div>
                    <h4>Best Practices:</h4>
                    <ul>
                        <li><strong>Keep it simple:</strong> One concept per flashcard</li>
                        <li><strong>Be specific:</strong> Clear questions get clear answers</li>
                        <li><strong>Use your own words:</strong> Don't just copy-paste</li>
                        <li><strong>Review regularly:</strong> Consistency is key to retention</li>
                        <li><strong>Focus on understanding:</strong> Not just memorization</li>
                    </ul>
                    <br />
                    <h4>Example Good Flashcard Written on Note (.md):</h4>
                    <pre className="guide-code">
                        {`- What are the three main components of a cell?
    - The three main components are:
        - Cell membrane (outer boundary)
        - Cytoplasm (gel-like substance)
        - Nucleus (contains genetic material)`}
                    </pre>
                    <br />
                    <h4>File Organization:</h4>
                    <p>Organize your notes by topic through their filenames:</p>
                    <pre className="guide-code">
                        {`biology.anatomy.md
biology.cell-structure.md
biology.genetics-basics.md
biology.dna-rna.md
biology.evolution-basics.md
biology.photosynthesis.md`}
                    </pre>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="flashcard-session-container">
            <div className="flashcard-modal">
                <div className="modal-header">
                    <h2>User Guide - {pages[currentPage].title}</h2>
                    <button className="close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="modal-content">
                    <div className="guide-content">
                        {pages[currentPage].content}
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="guide-navigation">
                        <button
                            className="btn-secondary"
                            onClick={handlePrev}
                            disabled={currentPage === 0}
                        >
                            ← Previous
                        </button>
                        <div className="guide-progress">
                            {currentPage + 1} / {pages.length}
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleNext}
                        >
                            {currentPage === pages.length - 1 ? 'Finish' : 'Next →'}
                        </button>
                    </div>
                    {showOnStartup && (
                        <label className="dont-show-again">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        onDontShowAgain();
                                    }
                                }}
                            />
                            <span>Don't show this again</span>
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Guide;