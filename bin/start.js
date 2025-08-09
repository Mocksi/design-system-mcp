#!/usr/bin/env node
// CLI entry for Design System MCP

const args = process.argv.slice(2);

async function run() {
  const cmd = (args[0] || 'start').toLowerCase();

  if (cmd === 'validate') {
    // Delegate to validation script
    await import(new URL('./validate.js', import.meta.url));
    return;
  }

  if (cmd === 'init') {
    // Delegate to init script
    await import(new URL('./init.js', import.meta.url));
    return;
  }

  if (cmd !== 'start') {
    console.error(`Unknown command: ${cmd}. Use "start", "init", or "validate".`);
    process.exit(1);
  }

  // Try to load compiled server
  try {
    const mod = await import(new URL('../dist/server.js', import.meta.url));
    if (mod && mod.DesignSystemMCPServer) {
      const server = new mod.DesignSystemMCPServer();
      await server.run();
      return;
    }
    // If module auto-runs on import, just return
    return;
  } catch (err) {
    console.error('[design-system-mcp] Could not load compiled server from dist/server.js');
    console.error('Error:', err && err.message ? err.message : String(err));
    console.error('Try running: npm run build  (or ensure you installed the published package)');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


