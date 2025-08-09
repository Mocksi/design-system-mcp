#!/usr/bin/env node
/*
 Init command for Design System MCP
 Copies sample tokens to ./design-system-mcp/tokens/
*/

import { existsSync, mkdirSync, cpSync } from 'fs';
import { resolve, join } from 'path';

function findExamplesPath() {
  // For global installs, the binary is usually a symlink to the real location
  // /opt/homebrew/bin/design-system-mcp -> /opt/homebrew/lib/node_modules/design-system-mcp/bin/start.js
  // We want: /opt/homebrew/lib/node_modules/design-system-mcp/examples/tokens
  
  const possiblePaths = [
    // From bin/start.js to examples/tokens
    resolve(process.argv[1], '../examples/tokens'),
    // From symlinked location, try to find the real package
    resolve(process.argv[1], '../../lib/node_modules/design-system-mcp/examples/tokens'),
    // Alternative global locations
    resolve(process.argv[1], '../../../design-system-mcp/examples/tokens'),
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
    console.log('Please install the package first:');
    console.log('  npm install -g design-system-mcp');
    console.log('');
    console.log('Then run: design-system-mcp init');
    process.exit(1);
  }
  
  if (existsSync(targetDir)) {
    console.log('✓ Token directory already exists at ./design-system-mcp/tokens/');
    console.log('');
    console.log('Next step:');
    console.log('  design-system-mcp validate');
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
    console.log('  design-system-mcp validate    # Test the setup');
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