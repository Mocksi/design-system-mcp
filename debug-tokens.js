#!/usr/bin/env node
import { readFileSync } from 'fs';
import { parseMultipleTokenFiles } from './dist/parsers/w3c-tokens.js';
// import { glob } from 'glob';

const tokenFiles = [
  './examples/tokens/colors-primitives.json',
  './examples/tokens/colors-semantic.json', 
  './examples/tokens/typography.json',
  './examples/tokens/spacing.json',
  './examples/tokens/components.json'
];

console.log('🔍 Debugging token file parsing...');
console.log(`Files to parse: ${tokenFiles.length}`);

for (const file of tokenFiles) {
  console.log(`\n📁 ${file}:`);
  try {
    const content = readFileSync(file, 'utf8');
    const data = JSON.parse(content);
    console.log(`  ✓ JSON valid`);
    console.log(`  Top-level keys: ${Object.keys(data).join(', ')}`);
  } catch (error) {
    console.log(`  ❌ JSON error: ${error.message}`);
  }
}

console.log('\n🧪 Testing parseMultipleTokenFiles...');
const result = parseMultipleTokenFiles(tokenFiles);

console.log('Result:', {
  fileCount: result.fileCount,
  totalTokens: result.totalTokens,
  categoriesFound: result.categories.length,
  categories: result.categories.map(c => c.name),
  errorCount: result.errors.length,
  errors: result.errors
});