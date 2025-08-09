#!/usr/bin/env node
/*
 Init command for Design System MCP
 Copies sample tokens to ./design-system-mcp/tokens/
*/

import { existsSync, mkdirSync, cpSync } from 'fs';
import { resolve, join } from 'path';

function findExamplesPath() {
  // Simple strategy - look for examples relative to this script and start.js
  const possiblePaths = [
    // From start.js calling init.js - look relative to project root
    resolve(process.argv[1], '../../examples/tokens'),
    resolve(process.argv[1], '../examples/tokens'), 
    // Local development - from project root
    resolve('./examples/tokens'),
    resolve('../examples/tokens'),
  ];
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

function main() {
  const targetDir = resolve('./design-system-mcp/tokens');
  const examplesPath = findExamplesPath();
  
  if (!examplesPath) {
    console.log('❌ Could not find sample tokens');
    console.log('');
    console.log('This might happen if:');
    console.log('- Package installation is corrupted');
    console.log('- Running from an unsupported location');
    console.log('');
    console.log('Try:');
    console.log('- Reinstall: npm install -g design-system-mcp');
    console.log('- Or manually create tokens directory and add your own W3C Design Token JSON files');
    process.exit(1);
  }
  
  if (existsSync(targetDir)) {
    console.log('✓ Token directory already exists at ./design-system-mcp/tokens/');
    console.log('');
    console.log('Next step:');
    console.log('  npx design-system-mcp validate');
    process.exit(0);
  }
  
  try {
    // Create the target directory
    mkdirSync(targetDir, { recursive: true });
    
    // Copy all example token files
    cpSync(examplesPath, targetDir, { recursive: true });
    
    console.log('✓ Copied sample tokens to ./design-system-mcp/tokens/');
    console.log('✓ Ready to test!');
    console.log('');
    console.log('Next steps:');
    console.log('  npx design-system-mcp validate    # Test the setup');
    console.log('  # Replace sample tokens with your own W3C Design Token JSON files');
    
  } catch (error) {
    console.log('❌ Failed to copy sample tokens:', error.message);
    console.log('');
    console.log('You can manually create the directory:');
    console.log('  mkdir -p design-system-mcp/tokens');
    console.log('  # Add your W3C Design Token JSON files there');
    process.exit(1);
  }
}

main();