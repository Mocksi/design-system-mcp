# Design System MCP

Prevent AI assistants from hallucinating design tokens by giving them read‑only access to your W3C Design Token JSON.

[![npm version](https://img.shields.io/npm/v/design-system-mcp)](https://www.npmjs.com/package/design-system-mcp) [![npm downloads](https://img.shields.io/npm/dm/design-system-mcp)](https://www.npmjs.com/package/design-system-mcp) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

## Try it in 60 seconds (TL;DR)

Prerequisites: Node >= 18

- Install (no global install required):
  ```bash
  npx design-system-mcp validate
  ```
  Tip: Validate immediately with bundled sample tokens
  - macOS/Linux:
    ```bash
    DESIGN_TOKENS_PATH=./examples/tokens npx design-system-mcp validate
    ```
  - Windows (PowerShell):
    ```powershell
    $env:DESIGN_TOKENS_PATH="./examples/tokens"; npx design-system-mcp validate
    ```

- Start the server (same env applies when used by an AI client):
  ```bash
  npx design-system-mcp start
  ```

- Point your AI client at the server (generic MCP client example):
  ```json
  {
    "mcpServers": {
      "design_system": {
        "command": "npx",
        "args": ["design-system-mcp", "start"],
        "env": { "DESIGN_TOKENS_PATH": "./design-system-mcp/tokens" }
      }
    }
  }
  ```
  See client‑specific configs for Claude Code, Cursor, and Claude Desktop below.

## Why this exists

- Ensures AI assistants use your real tokens instead of hallucinating values
- Normalizes various token sources (Figma Tokens, Style Dictionary, manual JSON) into W3C JSON
- Adds validation, discovery, and safe read‑only access via the MCP protocol

## Next steps

- Use the bundled examples or copy into a local tokens folder:
  - Recommended location: `./design-system-mcp/tokens/`
  - macOS/Linux:
    ```bash
    mkdir -p ./design-system-mcp && cp -r ./examples/tokens ./design-system-mcp/
    ```
  - Windows (PowerShell):
    ```powershell
    New-Item -ItemType Directory -Force -Path ./design-system-mcp | Out-Null
    Copy-Item -Recurse ./examples/tokens ./design-system-mcp/
    ```

- Or point to any folder with W3C Design Token JSON:
  - macOS/Linux:
    ```bash
    DESIGN_TOKENS_PATH=./path/to/your/tokens npx design-system-mcp validate
    ```
  - Windows (PowerShell):
    ```powershell
    $env:DESIGN_TOKENS_PATH="./path/to/your/tokens"; npx design-system-mcp validate
    ```

## Conventions at a glance

- Format: W3C Design Tokens (community group spec). Aliases use `{path.to.token}`.
- Structure: one or many `.json` files. Common top‑level keys: `colors`, `typography`, `spacing`, `components`, etc.
- Discovery: all `.json` under `DESIGN_TOKENS_PATH` are merged by category.

Jump to: Usage · Token File Format · Client configs (Claude Code · Cursor · Claude Desktop) · Troubleshooting · FAQ · Contributing

## MCP Client Configuration

### Claude Code
Create `.mcp.json` at your project root:
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "./design-system-mcp/tokens"
      }
    }
  }
}
```

### Claude Desktop
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "./design-system-mcp/tokens"
      }
    }
  }
}
```

### Cursor
Add to `~/.cursor/mcp.json` or project `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "./design-system-mcp/tokens"
      }
    }
  }
}
```

## Usage

Once configured, your AI assistant can:

1. **Discover available design tokens:**
   ```
   "What colors are available in our design system?"
   ```

2. **Get specific token details:**
   ```
   "Show me the primary-500 color token details"
   ```

3. **Build components with real tokens:**
   ```
   "Help me create a button using our design system tokens"
   ```

## Token File Format

This MCP server works with W3C Design Token JSON files. Place your token files in `./design-system-mcp/tokens/`:

```
design-system-mcp/tokens/
├── colors-primitives.json
├── colors-semantic.json
├── typography.json
├── spacing.json
└── components.json
```

### Example Token File
```json
{
  "colors": {
    "primary": {
      "50": {
        "$type": "color",
        "$value": "#eff6ff",
        "$description": "Primary color light variant"
      },
      "500": {
        "$type": "color", 
        "$value": "#3b82f6",
        "$description": "Primary color base"
      }
    }
  }
}
```

## Replacing Sample Tokens

Use this section when you’re ready to point the MCP at your team’s real tokens.

### Where to put your tokens

- Default location (recommended): `./design-system-mcp/tokens/`
- Use a different folder by setting `DESIGN_TOKENS_PATH` in your client config or shell
  - Example: `DESIGN_TOKENS_PATH=./path/to/your/tokens npx design-system-mcp validate`

### Supported file layouts

- Single file: `tokens.json` with multiple top‑level categories
- Multiple files (recommended): one or more files per category, for example:
  - `colors-primitives.json`, `colors-semantic.json`
  - `typography.json`
  - `spacing.json`
  - `components.json`

The server automatically discovers all `.json` files under the tokens directory and merges categories.

### Required format (W3C Design Tokens)

- Files must follow the W3C Design Token JSON format (latest community group spec)
- Top‑level keys should be standard categories such as `colors`, `typography`, `spacing`, `components`, etc.

Minimal examples:

```json
{
  "colors": {
    "primary": { "$type": "color", "$value": "#3b82f6" }
  }
}
```

```json
{
  "typography": {
    "heading": {
      "large": {
        "$type": "typography",
        "$value": { "fontFamily": "Inter", "fontSize": "32px", "fontWeight": 600, "lineHeight": "1.2" }
      }
    }
  }
}
```

### Using references/aliases

- You can reference other tokens with `{path.to.token}` syntax, e.g. `"$value": "{colors.primary}"`
- The server can optionally resolve references when returning category/token data

### Common workflows

- Figma Tokens / Tokens Studio: export to W3C JSON and copy into your tokens directory
- Style Dictionary: output W3C-compatible JSON and direct output to your tokens directory
- Manual JSON: follow the minimal examples above

### Validate and troubleshoot

1. Run: `npx design-system-mcp validate`
2. Expect output like: `Token files found: N files in <path>` and `Categories discovered: ...`
3. If none found, verify the directory and JSON validity or set `DESIGN_TOKENS_PATH`

### Quick checklist

- Tokens are in your selected directory (default `./design-system-mcp/tokens/`)
- Files end with `.json` and contain valid JSON
- Top‑level categories use standard names (`colors`, `typography`, `spacing`, `components`, ...)
- Optional: references use `{...}` syntax and point to existing tokens
- Validation shows files and expected categories

## Supported Token Creation Workflows

The MCP reads W3C Design Token JSON from your filesystem. Use any workflow that can output that format.

### Figma Tokens / Tokens Studio

1. Export your tokens as JSON in W3C format
2. Copy the exported files into your tokens directory (default `./design-system-mcp/tokens/`)
3. Validate:
   ```bash
   npx design-system-mcp validate
   ```

Notes:
- Use `{path.to.token}` alias syntax to reference other tokens
- Consider splitting primitives and semantic tokens into separate files

### Style Dictionary

1. Configure your Style Dictionary build to emit plain JSON aligned to W3C keys (`colors`, `typography`, `spacing`, `components`, ...)
2. Output the build to a target directory, e.g. `./build/tokens`
3. Point the MCP at that directory via env:
   ```bash
   DESIGN_TOKENS_PATH=./build/tokens npx design-system-mcp validate
   ```

Tips:
- Keep aliases in output when possible (e.g. `"$value": "{colors.primary}"`)
- If your output is platform-specific (e.g. CSS/TS), also emit a raw JSON target for the MCP

### Design Token Studio

1. Export tokens as W3C JSON
2. Copy to your tokens directory or point `DESIGN_TOKENS_PATH` to the export location
3. Validate with the command above

### Manual JSON

1. Create `.json` files with top‑level categories (`colors`, `typography`, `spacing`, `components`, ...)
2. Follow the minimal examples in this README
3. Validate and iterate

## Supported Token Creation Workflows

- **Figma Tokens Plugin** → W3C JSON → Design System MCP
- **Style Dictionary** → W3C JSON → Design System MCP  
- **Design Token Studio** → W3C JSON → Design System MCP
- **Manual JSON editing** → W3C JSON → Design System MCP

## Commands

- `npx design-system-mcp start` - Start the MCP server (used by AI clients)
- `npx design-system-mcp validate` - Validate your token setup

## Troubleshooting

### No tokens found
```
No tokens found in ./design-system-mcp/tokens/. 
Copy sample tokens from node_modules/design-system-mcp/examples/tokens/ to get started.
```

### AI client can't connect
1. Restart your AI client completely after configuration changes
2. Check that the config file is in the correct location for your platform
3. Verify the token directory path in your configuration

### Invalid token files
The validate command will show specific errors:
```
colors.json line 15: Missing required '$type' field for token 'primary-500'
```

## FAQ

### Where do my tokens go?
Default: `./design-system-mcp/tokens/`. Or set `DESIGN_TOKENS_PATH` to any folder with W3C Design Token JSON files.

### Do I need Figma Tokens or Style Dictionary?
No. Any valid W3C Design Token JSON works. Those tools are just convenient producers.

### Can I split tokens across multiple files?
Yes. All `.json` files under `DESIGN_TOKENS_PATH` are discovered and merged by category.

### How do aliases work?
Use `{path.to.token}` in `"$value"`. Aliases can be resolved when returning category/token data.

### How do I test without copying tokens?
Run with the bundled examples:
```bash
DESIGN_TOKENS_PATH=./examples/tokens npx design-system-mcp validate
```

## Contributing

1. Node >= 18
2. Install dependencies:
   ```bash
   npm i
   ```
3. Run tests and typecheck:
   ```bash
   npm run test
   npm run build
   ```
4. Dev loop:
   ```bash
   npm run dev
   ```
5. Open a PR with a clear description and tests for changes.

## License

MIT