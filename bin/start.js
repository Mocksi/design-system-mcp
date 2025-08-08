#!/usr/bin/env node
// Minimal CLI entry to support `npx design-system-mcp validate` for now.
// `start` (MCP server) will be wired in a later task.

const args = process.argv.slice(2);

async function run() {
  const cmd = args[0] || 'start';

  if (cmd === 'validate') {
    // Defer to the validate script
    const mod = await import(new URL('./validate.js', import.meta.url));
    // If validate.js exports a main, call it; otherwise it already executed on import
    if (mod && typeof mod.default === 'function') {
      await mod.default();
    }
    return;
  }

  // Placeholder until MCP server wiring is added in a later task
  console.error('MCP server start command not yet implemented. Use `npx design-system-mcp validate` for now.');
  process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


