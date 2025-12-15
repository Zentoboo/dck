// Migration script to fix questionIds in existing .flashcard files
// Run this once to update all .flashcard files with correct IDs

const fs = require('fs');
const path = require('path');

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateQuestionId(question, sourceFile) {
  // Always use just the filename, not the full path
  const fileName = sourceFile.split('/').pop()?.split('\\').pop() || sourceFile;
  const content = question.trim().substring(0, 100) + fileName;
  return 'q_' + simpleHash(content);
}

function migrateFlashcardFile(flashcardPath) {
  console.log('Migrating:', flashcardPath);
  
  const content = fs.readFileSync(flashcardPath, 'utf-8');
  const data = JSON.parse(content);
  
  // Extract filename from sourceFile
  const fileName = data.sourceFile.split('/').pop()?.split('\\').pop() || data.sourceFile;
  console.log('  File:', fileName);
  
  // Update each card's questionId
  data.cards.forEach(card => {
    const oldId = card.questionId;
    const newId = generateQuestionId(card.question, fileName);
    
    if (oldId !== newId) {
      console.log('  Updating card:', card.question.substring(0, 50));
      console.log('    Old ID:', oldId);
      console.log('    New ID:', newId);
      card.questionId = newId;
    }
  });
  
  // Write back
  fs.writeFileSync(flashcardPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('  ✓ Migrated', data.cards.length, 'cards\n');
}

function migrateFolder(folderPath) {
  console.log('Scanning folder:', folderPath, '\n');
  
  const files = fs.readdirSync(folderPath);
  let count = 0;
  
  files.forEach(file => {
    if (file.endsWith('.flashcard')) {
      const fullPath = path.join(folderPath, file);
      migrateFlashcardFile(fullPath);
      count++;
    }
  });
  
  console.log('Total files migrated:', count);
}

// Usage: node migrate-flashcards.js <folder-path>
const folderPath = process.argv[2];

if (!folderPath) {
  console.error('Usage: node migrate-flashcards.js <folder-path>');
  console.error('Example: node migrate-flashcards.js D:\\study\\2509\\fyp\\test-folder');
  process.exit(1);
}

if (!fs.existsSync(folderPath)) {
  console.error('Folder does not exist:', folderPath);
  process.exit(1);
}

migrateFolder(folderPath);
console.log('\n✓ Migration complete!');
console.log('Please restart the app to see the updated statistics.');