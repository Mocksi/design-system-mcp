#!/usr/bin/env node
/*
 Basic validation command for Design System MCP
 Outputs: token files found and categories discovered
*/

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { resolve, join, extname } from 'path';

const KNOWN_CATEGORIES = new Set([
  'colors',
  'typography',
  'spacing',
  'borders',
  'shadows',
  'animations',
  'components',
]);

function getTokenDirectory() {
  if (process.env.DESIGN_TOKENS_PATH) {
    return resolve(process.env.DESIGN_TOKENS_PATH);
  }
  // Default expected location per PRD
  return resolve('./design-system-mcp/tokens');
}

// Removed complex path detection - users should run `npx design-system-mcp init` first

function findJsonFilesRecursive(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isDirectory()) {
          // ignore common folders
          const name = entry.toLowerCase();
          if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'build') continue;
          files.push(...findJsonFilesRecursive(full));
        } else if (st.isFile() && extname(entry).toLowerCase() === '.json') {
          files.push(full);
        }
      } catch {}
    }
  } catch {}
  return files.sort();
}

function collectCategoriesFromJson(obj) {
  const categories = new Set();
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (KNOWN_CATEGORIES.has(key)) categories.add(key);
    }
  }
  return categories;
}

function main() {
  const dir = getTokenDirectory();
  
  if (!existsSync(dir)) {
    console.log(`Token files found: 0 files in ${dir}`);
    console.log('Categories discovered: none');
    console.log('');
    console.log('Next steps:');
    console.log('1. Initialize sample tokens: npx design-system-mcp init');
    console.log('2. Run validation again: npx design-system-mcp validate');
    console.log('');
    console.log('Or use custom path: DESIGN_TOKENS_PATH=./path/to/tokens npx design-system-mcp validate');
    process.exit(0);
  }

  const files = findJsonFilesRecursive(dir);
  if (files.length === 0) {
    console.log(`Token files found: 0 files in ${dir}`);
    console.log('Categories discovered: none');
    console.log('Hint: Add .json files with W3C Design Tokens to the directory');
    process.exit(0);
  }

  const categories = new Set();
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const json = JSON.parse(content);
      const cats = collectCategoriesFromJson(json);
      cats.forEach(c => categories.add(c));
    } catch {
      // ignore malformed files for this basic summary
    }
  }

  const categoriesList = Array.from(categories).sort();
  
  console.log(`✓ Token files found: ${files.length} file${files.length === 1 ? '' : 's'} in ${dir.replace(process.cwd(), '.')}`);
  
  if (categoriesList.length > 0) {
    console.log(`✓ Categories discovered: ${categoriesList.join(', ')}`);
  } else {
    console.log('Categories discovered: none');
  }
}

main();


