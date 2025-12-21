import React, { useState } from 'react';

interface GuideProps {
    onClose: () => void;
}

const Guide: React.FC<GuideProps> = ({ onClose }) => {
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
                        <li><strong>Markdown Notes:</strong> Write notes in Markdown format with full editor support</li>
                        <li><strong>Inline Flashcards:</strong> Create flashcards directly within your notes</li>
                        <li><strong>AI-Powered Evaluation:</strong> Get intelligent feedback on your answers</li>
                        <li><strong>Spaced Repetition:</strong> FSRS algorithm optimizes your learning schedule</li>
                        <li><strong>Learning Statistics:</strong> Track your progress over time</li>
                        <li><strong>Customizable Shortcuts:</strong> Personalize keyboard shortcuts to your workflow</li>
                    </ul>
                </div>
            )
        },
        {
            title: 'Getting Started',
            content: (
                <div>
                    <h4>Quick Start Guide:</h4>
                    <ol>
                        <li><strong>Select a Folder:</strong> Click "Select" in the sidebar to choose a folder for your notes</li>
                        <li><strong>Create Your First Note:</strong> Click "New" to create a markdown file</li>
                        <li><strong>Write Flashcards:</strong> Use the Q&A format (explained in next page)</li>
                        <li><strong>Start Learning:</strong> Click the flashcard icon (📚) to begin a session</li>
                    </ol>
                    <br />
                    <h4>File Organization:</h4>
                    <p>Use dot notation in filenames to create a hierarchical structure:</p>
                    <pre className="guide-code">
                        {`biology.anatomy.md
biology.cell-structure.md
chemistry.organic.md
chemistry.inorganic.md`}
                    </pre>
                    <p>This creates a tree structure in the sidebar for easy organization.</p>
                </div>
            )
        },
        {
            title: 'Creating Flashcards',
            content: (
                <div>
                    <p>Flashcards use a simple Q&A format in your markdown files:</p>
                    <br />
                    <h4>Basic Format:</h4>
                    <pre className="guide-code">
                        {`- What is photosynthesis?
    - Photosynthesis is the process by which plants convert 
      light energy into chemical energy stored in glucose.`}
                    </pre>
                    <p><strong>Key Rule:</strong> The answer must be indented (use Tab or spaces) right after the question.</p>
                    <br />
                    <h4>Multiple Flashcards:</h4>
                    <pre className="guide-code">
                        {`- What is DNA?
    - DNA (Deoxyribonucleic Acid) is a molecule that carries 
      genetic instructions for life.

- What are the four DNA bases?
    - Adenine (A), Thymine (T), Cytosine (C), and Guanine (G)`}
                    </pre>
                    <br />
                    <h4>With Code or Lists:</h4>
                    <pre className="guide-code">
                        {`- How do you create a list in Python?
    - \`\`\`python
      my_list = [1, 2, 3, 4, 5]
      # or
      my_list = list(range(1, 6))
      \`\`\``}
                    </pre>
                </div>
            )
        },
        {
            title: 'Markdown Editor',
            content: (
                <div>
                    <p>The editor supports all standard Markdown formatting:</p>
                    <br />
                    <h4>Text Formatting:</h4>
                    <ul>
                        <li><strong>Bold:</strong> **text** or <code>Ctrl/Cmd + B</code></li>
                        <li><em>Italic:</em> *text* or <code>Ctrl/Cmd + I</code></li>
                        <li><code>Code:</code> `code` or <code>Ctrl/Cmd + K</code></li>
                        <li><del>Strikethrough:</del> ~~text~~ or <code>Ctrl/Cmd + U</code></li>
                    </ul>
                    <br />
                    <h4>Headings:</h4>
                    <pre className="guide-code">
                        {`# Heading 1      Ctrl/Cmd + 1
## Heading 2     Ctrl/Cmd + 2
### Heading 3    Ctrl/Cmd + 3`}
                    </pre>
                    <br />
                    <h4>Lists and Indentation:</h4>
                    <ul>
                        <li><strong>Indent:</strong> <code>Tab</code> (increases indentation)</li>
                        <li><strong>Unindent:</strong> <code>Shift + Tab</code> (decreases indentation)</li>
                    </ul>
                    <pre className="guide-code">
                        {`- Main item
    - Nested item (press Tab)
        - Deeper nested (press Tab again)`}
                    </pre>
                    <br />
                    <h4>Preview Mode:</h4>
                    <p>Press <code>Ctrl/Cmd + P</code> to toggle preview of your formatted notes.</p>
                </div>
            )
        },
        {
            title: 'Keyboard Shortcuts',
            content: (
                <div>
                    <h4>Essential Shortcuts:</h4>
                    <ul>
                        <li><code>Ctrl/Cmd + S</code> - Save current file</li>
                        <li><code>Ctrl/Cmd + P</code> - Toggle preview mode</li>
                        <li><code>Ctrl/Cmd + N</code> - Create new file</li>
                        <li><code>Ctrl/Cmd + D</code> - Delete current file</li>
                        <li><code>Ctrl/Cmd + F</code> - Start flashcard session</li>
                        <li><code>Ctrl/Cmd + E</code> - View statistics</li>
                        <li><code>Ctrl/Cmd + ,</code> - Open settings</li>
                        <li><code>Ctrl/Cmd + /</code> - Open this guide</li>
                    </ul>
                    <br />
                    <h4>Customization:</h4>
                    <p>You can customize all keyboard shortcuts in <strong>Settings → Keyboard Shortcuts</strong> tab.</p>
                    <p>Click on any shortcut, then press your desired key combination.</p>
                    <br />
                    <h4>Search Feature:</h4>
                    <p>Use the search box above your notes list to quickly find files by name.</p>
                </div>
            )
        },
        {
            title: 'Flashcard Sessions',
            content: (
                <div>
                    <h4>Starting a Session:</h4>
                    <ol>
                        <li>Click the flashcard icon (📚) in the header</li>
                        <li>Search and select which files to include</li>
                        <li>Click "Start Session" to begin</li>
                    </ol>
                    <br />
                    <h4>Two Review Modes:</h4>
                    <ul>
                        <li><strong>Review Mode:</strong> Only shows cards that are due for review based on spaced repetition</li>
                        <li><strong>Study Mode:</strong> Shows all cards regardless of schedule (good for cramming)</li>
                    </ul>
                    <br />
                    <h4>Saved Decks:</h4>
                    <p>Save your frequently used file combinations as presets for quick access.</p>
                    <br />
                    <h4>During Review:</h4>
                    <ul>
                        <li><strong>Show Answer:</strong> Click to reveal the answer</li>
                        <li><strong>Rate Your Response:</strong> Choose Again/Hard/Good/Easy</li>
                        <li><strong>Skip Card:</strong> Mark for later review without affecting schedule</li>
                        <li><strong>Session Stats:</strong> View progress in the header</li>
                    </ul>
                </div>
            )
        },
        {
            title: 'AI-Powered Evaluation',
            content: (
                <div>
                    <p>dck can evaluate your answers using AI and provide intelligent feedback:</p>
                    <br />
                    <h4>Setup:</h4>
                    <ol>
                        <li>Go to <strong>Settings → AI Evaluation</strong></li>
                        <li>Add your AI provider (Claude or Grok)</li>
                        <li>Enter your API key</li>
                        <li>Enable AI Evaluation</li>
                    </ol>
                    <br />
                    <h4>During Reviews:</h4>
                    <p>After typing your answer, AI will analyze it and provide:</p>
                    <ul>
                        <li><strong>Overall Score:</strong> 0-100 rating of your answer quality</li>
                        <li><strong>Detailed Feedback:</strong> What was good and what could be improved</li>
                        <li><strong>Suggested Rating:</strong> AI recommendation (Again/Hard/Good/Easy)</li>
                    </ul>
                    <br />
                    <p><strong>Note:</strong> AI evaluation requires internet connection. You can still use manual ratings without AI.</p>
                </div>
            )
        },
        {
            title: 'Spaced Repetition (FSRS)',
            content: (
                <div>
                    <p>dck uses the FSRS algorithm to optimize when you review each card:</p>
                    <br />
                    <h4>Card States:</h4>
                    <ul>
                        <li><strong>New:</strong> Cards you've never reviewed</li>
                        <li><strong>Learning:</strong> Cards you're currently learning (short intervals)</li>
                        <li><strong>Review:</strong> Cards you know well (longer intervals)</li>
                        <li><strong>Relearning:</strong> Cards you forgot (need to relearn)</li>
                    </ul>
                    <br />
                    <h4>Rating System:</h4>
                    <ul>
                        <li><strong>Again (1):</strong> Completely wrong → Card resets, review soon</li>
                        <li><strong>Hard (2):</strong> Difficult to recall → Shorter interval</li>
                        <li><strong>Good (3):</strong> Correct answer → Standard interval</li>
                        <li><strong>Easy (4):</strong> Very easy → Longer interval</li>
                    </ul>
                    <br />
                    <h4>How It Works:</h4>
                    <p>The algorithm learns from your ratings and adjusts intervals to show cards right before you're about to forget them - maximizing retention while minimizing review time.</p>
                </div>
            )
        },
        {
            title: 'Statistics Dashboard',
            content: (
                <div>
                    <p>Track your learning progress over time:</p>
                    <br />
                    <h4>Available Metrics:</h4>
                    <ul>
                        <li><strong>Total Cards:</strong> Number of flashcards across all files</li>
                        <li><strong>Due Today:</strong> Cards scheduled for review today</li>
                        <li><strong>Reviewed Today:</strong> Cards you've already reviewed</li>
                        <li><strong>Retention Rate:</strong> Percentage of cards you remember correctly</li>
                        <li><strong>Study Streak:</strong> Consecutive days you've studied</li>
                        <li><strong>Average AI Score:</strong> Your average AI evaluation score</li>
                    </ul>
                    <br />
                    <h4>File Statistics:</h4>
                    <p>View detailed stats for each note file including:</p>
                    <ul>
                        <li>Number of cards per file</li>
                        <li>Cards by state (New, Learning, Review)</li>
                        <li>Average ease factor</li>
                        <li>Review history</li>
                    </ul>
                    <br />
                    <p>Click the statistics icon (📊) in the header to view your dashboard.</p>
                </div>
            )
        },
        {
            title: 'Tips for Effective Learning',
            content: (
                <div>
                    <h4>Best Practices:</h4>
                    <ul>
                        <li><strong>One Concept Per Card:</strong> Keep flashcards focused on single ideas</li>
                        <li><strong>Be Specific:</strong> Clear, specific questions get clear answers</li>
                        <li><strong>Use Your Own Words:</strong> Rephrase concepts in your own understanding</li>
                        <li><strong>Review Consistently:</strong> Daily reviews are more effective than cramming</li>
                        <li><strong>Focus on Understanding:</strong> Aim to understand concepts, not just memorize</li>
                        <li><strong>Use AI Feedback:</strong> Learn from AI suggestions to improve your answers</li>
                    </ul>
                    <br />
                    <h4>Example Well-Written Flashcard:</h4>
                    <pre className="guide-code">
                        {`- What are the three main components of a eukaryotic cell?
    - The three main components are:
        1. Cell membrane - controls what enters/exits the cell
        2. Cytoplasm - gel-like substance containing organelles
        3. Nucleus - contains DNA and controls cell activities`}
                    </pre>
                    <br />
                    <h4>Organizing Your Notes:</h4>
                    <p>Structure your files by subject and topic:</p>
                    <pre className="guide-code">
                        {`biology.cell-biology.md
biology.genetics.md
chemistry.organic-reactions.md
physics.mechanics.kinematics.md`}
                    </pre>
                    <p>This creates a clean hierarchy in your sidebar and helps you create targeted flashcard sessions.</p>
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
                </div>
            </div>
        </div>
    );
};

export default Guide;