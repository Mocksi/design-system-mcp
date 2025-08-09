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

function getBundledExamplesPath() {
  // Try to find bundled examples - multiple strategies
  const possiblePaths = [
    // Local node_modules (most common)
    resolve('./node_modules/design-system-mcp/examples/tokens'),
    // Parent directories for global installs via npx
    resolve(process.argv[1], '../../examples/tokens'),
    resolve(process.argv[1], '../../../examples/tokens'),
    // Current working directory (dev mode)
    resolve('./examples/tokens'),
  ];
  
  for (const path of possiblePaths) {
    try {
      if (existsSync(path)) {
        return path;
      }
    } catch {}
  }
  
  return null;
}

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
  let actualDir = dir;
  let usingBundledExamples = false;
  
  // Check if local tokens exist
  if (!existsSync(dir)) {
    // Try to fallback to bundled examples
    const bundledPath = getBundledExamplesPath();
    if (bundledPath) {
      actualDir = bundledPath;
      usingBundledExamples = true;
    } else {
      console.log(`Token files found: 0 files in ${dir}`);
      console.log('Categories discovered: none');
      console.log('');
      console.log('Next steps:');
      console.log('- Install the package: npm install design-system-mcp');
      console.log('- Copy sample tokens: cp -r node_modules/design-system-mcp/examples/tokens ./design-system-mcp/');
      console.log('- Or set custom path: DESIGN_TOKENS_PATH=./path/to/tokens npx design-system-mcp validate');
      process.exit(0);
    }
  }

  const files = findJsonFilesRecursive(actualDir);
  if (files.length === 0) {
    if (usingBundledExamples) {
      console.log('⚠️  No bundled examples found');
      console.log('Package may be corrupted - try reinstalling');
    } else {
      console.log(`Token files found: 0 files in ${dir}`);
      console.log('Categories discovered: none');
      console.log('Hint: Add .json files with W3C Design Tokens to the directory');
    }
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
  
  if (usingBundledExamples) {
    console.log('✓ Using bundled examples (no local tokens found)');
  }
  
  console.log(`✓ Token files found: ${files.length} file${files.length === 1 ? '' : 's'} in ${actualDir.replace(process.cwd(), '.')}`);
  
  if (categoriesList.length > 0) {
    console.log(`✓ Categories discovered: ${categoriesList.join(', ')}`);
  } else {
    console.log('Categories discovered: none');
  }
  
  if (usingBundledExamples) {
    console.log('');
    console.log('Next steps:');
    console.log('- Copy examples: cp -r node_modules/design-system-mcp/examples/tokens ./design-system-mcp/');
    console.log('- Or point to your tokens: DESIGN_TOKENS_PATH=./path/to/tokens npx design-system-mcp validate');
  }
}

main();


