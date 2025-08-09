#!/usr/bin/env node
/*
 Basic validation command for Design System MCP
 Outputs: token files found and categories discovered
*/

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { resolve, join, extname } from 'path';
import { TokenFileParser, parseMultipleTokenFiles, categorizeTokens } from '../dist/parsers/w3c-tokens.js';

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
          // ignore common folders and hidden directories
          const name = entry.toLowerCase();
          if (name === 'node_modules' || name === '.git' || name === 'dist' || 
              name === 'build' || name === '.vscode' || name === '.idea') continue;
          files.push(...findJsonFilesRecursive(full));
        } else if (st.isFile() && extname(entry).toLowerCase() === '.json') {
          // Include all JSON files, including W3C metadata files
          files.push(full);
        }
      } catch {}
    }
  } catch {}
  return files.sort();
}

function categorizeTokenFiles(files) {
  const tokenFiles = [];
  const metadataFiles = [];
  
  for (const file of files) {
    const fileName = file.split('/').pop() || '';
    
    // W3C metadata files (still process them but handle separately if needed)
    if (fileName.startsWith('$')) {
      metadataFiles.push(file);
    } else {
      tokenFiles.push(file);
    }
  }
  
  return { tokenFiles, metadataFiles, allFiles: files };
}

function detectTokenFileStructure(files) {
  // Quick check to see if files look like simple structure or W3C structure
  let simpleStructureCount = 0;
  let w3cStructureCount = 0;
  
  for (const file of files.slice(0, 5)) { // Check first 5 files max
    try {
      const content = readFileSync(file, 'utf8');
      const json = JSON.parse(content);
      
      // Check for W3C indicators: tokens with $type and $value
      const hasW3CTokens = hasW3CStructure(json);
      // Check for simple structure: direct category keys at root
      const hasSimpleStructure = hasSimpleStructure(json);
      
      if (hasW3CTokens) w3cStructureCount++;
      if (hasSimpleStructure) simpleStructureCount++;
      
    } catch {
      // Skip malformed files for structure detection
      continue;
    }
  }
  
  // Return primary structure type
  if (w3cStructureCount > simpleStructureCount) {
    return 'w3c';
  } else if (simpleStructureCount > 0) {
    return 'simple';
  } else {
    return 'mixed'; // Try both approaches
  }
}

function hasW3CStructure(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || depth > 3) {
    return false;
  }
  
  // Check if this object has W3C token properties
  if (obj.$type && obj.$value) {
    return true;
  }
  
  // Recursively check nested objects
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue; // Skip metadata
    if (hasW3CStructure(value, depth + 1)) {
      return true;
    }
  }
  
  return false;
}

function hasSimpleStructure(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  
  // Check for direct category keys at root level
  for (const key of Object.keys(obj)) {
    if (KNOWN_CATEGORIES.has(key)) {
      return true;
    }
  }
  
  return false;
}

function collectCategoriesFromFiles(files) {
  // Detect the primary token file structure
  const structure = detectTokenFileStructure(files);
  
  // Try W3C parsing first if structure suggests W3C or mixed
  if (structure === 'w3c' || structure === 'mixed') {
    try {
      const result = parseMultipleTokenFiles(files);
      
      // Check for parsing errors and provide helpful feedback
      if (result.errors && result.errors.length > 0) {
        const errorCount = result.errors.length;
        const fileErrors = groupErrorsByFile(result.errors);
        
        console.log(`⚠️  W3C validation issues found in ${fileErrors.size} file${fileErrors.size === 1 ? '' : 's'}:`);
        
        // Show first few errors for context
        let errorNum = 0;
        for (const [fileName, errors] of fileErrors.entries()) {
          if (errorNum >= 3) {
            console.log(`  ... and ${errorCount - errorNum} more validation issues`);
            break;
          }
          console.log(`  • ${fileName}: ${errors[0]}`);
          errorNum++;
        }
        console.log(''); // Add spacing
      }
      
      // If W3C parsing found valid tokens, use those categories
      if (result.categories && result.categories.length > 0) {
        const categories = new Set();
        result.categories.forEach(category => {
          categories.add(category.name);
        });
        return { 
          categories, 
          hasErrors: result.errors.length > 0, 
          parsingMode: 'w3c',
          structure 
        };
      }
      
    } catch (error) {
      if (structure === 'w3c') {
        console.log(`❌ W3C parsing failed: ${error.message}`);
      }
    }
  }
  
  // Fall back to simple/permissive parsing for simple structure or failed W3C
  if (structure === 'simple') {
    console.log('📝 Using simple token structure parsing...');
    const categories = collectCategoriesSimple(files);
    return { 
      categories, 
      hasErrors: false, 
      parsingMode: 'simple',
      structure 
    };
  } else {
    console.log('🔄 Falling back to permissive parsing for broader compatibility...');
    const categories = collectCategoriesPermissive(files);
    return { 
      categories, 
      hasErrors: true, 
      parsingMode: 'permissive',
      structure 
    };
  }
}

function groupErrorsByFile(errors) {
  const fileErrors = new Map();
  
  for (const error of errors) {
    const lines = error.split('\n');
    const firstLine = lines[0];
    const colonIndex = firstLine.indexOf(':');
    
    if (colonIndex > -1) {
      const fileName = firstLine.substring(0, colonIndex);
      const errorMessage = firstLine.substring(colonIndex + 1).trim();
      
      if (!fileErrors.has(fileName)) {
        fileErrors.set(fileName, []);
      }
      fileErrors.get(fileName).push(errorMessage);
    }
  }
  
  return fileErrors;
}

function collectCategoriesPermissive(files) {
  const categories = new Set();
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const json = JSON.parse(content);
      
      // Recursively find tokens and infer categories from their types
      const foundCategories = findCategoriesInObject(json, []);
      foundCategories.forEach(c => categories.add(c));
      
    } catch {
      // ignore malformed files for this basic summary
    }
  }
  
  return categories;
}

function findCategoriesInObject(obj, path = []) {
  const categories = new Set();
  
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    // Check if this looks like a token (has type and value properties)
    if (obj.type || obj.$type) {
      const tokenType = obj.type || obj.$type;
      const category = mapTypeToCategory(tokenType);
      if (category) {
        categories.add(category);
      }
    }
    
    // Check for simple category names at root level
    if (path.length === 0) {
      for (const key of Object.keys(obj)) {
        if (KNOWN_CATEGORIES.has(key)) {
          categories.add(key);
        }
      }
    }
    
    // Recursively check nested objects
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // Skip metadata
      const nestedCategories = findCategoriesInObject(value, [...path, key]);
      nestedCategories.forEach(c => categories.add(c));
    }
  }
  
  return categories;
}

function mapTypeToCategory(tokenType) {
  switch (tokenType) {
    case 'color':
      return 'colors';
    case 'dimension':
    case 'sizing':
      return 'spacing';
    case 'fontFamily':
    case 'fontWeight':
    case 'fontSize':
    case 'typography':
    case 'text': // Handle legacy text type
      return 'typography';
    case 'border':
    case 'borderWidth':
    case 'borderStyle':
      return 'borders';
    case 'shadow':
    case 'boxShadow':
      return 'shadows';
    case 'duration':
    case 'cubicBezier':
    case 'transition':
      return 'animations';
    default:
      return null;
  }
}

// Keep original logic as fallback for simple token files
function collectCategoriesFromJsonSimple(obj) {
  const categories = new Set();
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (KNOWN_CATEGORIES.has(key)) categories.add(key);
    }
  }
  return categories;
}

// Enhanced simple parsing that processes all files in simple mode
function collectCategoriesSimple(files) {
  const categories = new Set();
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const json = JSON.parse(content);
      
      // Use the original simple logic
      const fileCategories = collectCategoriesFromJsonSimple(json);
      fileCategories.forEach(c => categories.add(c));
      
    } catch {
      // ignore malformed files for this basic summary
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
    console.log('1. Install: npm install -g design-system-mcp');
    console.log('2. Initialize sample tokens: design-system-mcp init');
    console.log('3. Run validation: design-system-mcp validate');
    console.log('');
    console.log('Or use custom path: DESIGN_TOKENS_PATH=./path/to/tokens design-system-mcp validate');
    process.exit(0);
  }

  const files = findJsonFilesRecursive(dir);
  if (files.length === 0) {
    console.log(`Token files found: 0 files in ${dir}`);
    console.log('Categories discovered: none');
    console.log('Hint: Add .json files with W3C Design Tokens to the directory');
    process.exit(0);
  }

  // Categorize files for better W3C structure handling
  const fileStructure = categorizeTokenFiles(files);
  
  // Use enhanced parsing to detect categories with structure detection
  const result = collectCategoriesFromFiles(files);
  const categories = result.categories || result; // Handle both old and new return formats
  const hasErrors = result.hasErrors || false;
  const parsingMode = result.parsingMode || 'unknown';
  const structure = result.structure || 'unknown';

  const categoriesList = Array.from(categories).sort();
  
  // Consistent output format for all parsing modes
  console.log(`✓ Token files found: ${files.length} file${files.length === 1 ? '' : 's'} in ${dir.replace(process.cwd(), '.')}`);
  
  // Show metadata files only for W3C structures
  if (fileStructure.metadataFiles.length > 0 && (parsingMode === 'w3c' || structure === 'w3c')) {
    console.log(`  └─ W3C metadata files: ${fileStructure.metadataFiles.length} file${fileStructure.metadataFiles.length === 1 ? '' : 's'}`);
  }
  
  if (categoriesList.length > 0) {
    // Choose appropriate status icon and messaging based on parsing mode
    let statusIcon, helpMessage;
    
    if (parsingMode === 'simple') {
      statusIcon = '✅';
      helpMessage = null; // No additional message for successful simple parsing
    } else if (parsingMode === 'w3c' && !hasErrors) {
      statusIcon = '✅';
      helpMessage = null; // No additional message for successful W3C parsing
    } else if (parsingMode === 'w3c' && hasErrors) {
      statusIcon = '⚠️';
      helpMessage = '💡 Some tokens have validation issues but categories were still detected.';
    } else {
      statusIcon = '⚠️';
      helpMessage = '💡 Categories detected using fallback parsing. Consider updating to W3C format for better validation.';
    }
    
    console.log(`${statusIcon} Categories discovered: ${categoriesList.join(', ')}`);
    
    if (helpMessage) {
      console.log(helpMessage);
    }
  } else {
    console.log('❌ Categories discovered: none');
    
    // Provide appropriate guidance based on structure
    if (structure === 'simple') {
      console.log('💡 No known categories found. Ensure your tokens are organized under: colors, typography, spacing, borders, shadows, animations, components');
    } else if (structure === 'w3c') {
      console.log('💡 This may indicate W3C token format issues. Check that tokens have proper $type and $value properties.');
    } else {
      console.log('💡 No token categories detected. Check your token file format and structure.');
    }
  }
}

main();


