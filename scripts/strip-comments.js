#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function stripComments(content) {
  const lines = content.split('\n');
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip standalone comment lines
    if (line.trim().startsWith('//')) {
      continue;
    }

    // Find comment position, but avoid strings
    let commentIndex = -1;
    let inString = false;
    let stringChar = '';

    for (let j = 0; j < line.length - 1; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      // Track string boundaries
      if ((char === '"' || char === "'" || char === '`') && line[j - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }

      // Look for comment outside of strings
      if (!inString && char === '/' && nextChar === '/') {
        commentIndex = j;
        break;
      }
    }

    if (commentIndex !== -1) {
      const beforeComment = line.substring(0, commentIndex);
      if (beforeComment.trim() === '') {
        continue;
      }
      processedLines.push(beforeComment.trimEnd());
    } else {
      processedLines.push(line);
    }
  }

  // Clean up excessive blank lines
  const cleanedLines = [];
  let consecutiveBlankLines = 0;

  for (const line of processedLines) {
    if (line.trim() === '') {
      consecutiveBlankLines++;
      if (consecutiveBlankLines <= 2) {
        cleanedLines.push(line);
      }
    } else {
      consecutiveBlankLines = 0;
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const strippedContent = stripComments(content);

    if (content !== strippedContent) {
      fs.writeFileSync(filePath, strippedContent);
      console.log(`✅ Stripped comments from: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log('No files provided for comment stripping');
    process.exit(0);
  }

  let modifiedCount = 0;

  files.forEach(file => {
    if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      if (processFile(file)) {
        modifiedCount++;
      }
    }
  });

  if (modifiedCount > 0) {
    console.log(`🧹 Comment stripping complete: ${modifiedCount} files modified`);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { stripComments, processFile };
