# Design System MCP

A focused Model Context Protocol server that prevents AI coding assistants from hallucinating design tokens by providing direct access to W3C Design Token JSON files.

## Quick Start

1. **Install the package:**
   ```bash
   npm install -g design-system-mcp
   ```

2. **Copy sample tokens:**
   - If installed globally via npm:
     ```bash
     cp -r $(npm root -g)/design-system-mcp/examples/tokens ./design-system-mcp/
     ```
   - If using this repository directly:
     ```bash
     cp -r ./examples/tokens ./design-system-mcp/
     ```

3. **Copy example client configs (optional, for quick start):**
   ```bash
   # Claude Code (project root)
   cp ./examples/mcp-configs/.mcp.json ./

   # Cursor (project)
   cp ./examples/mcp-configs/.cursor-mcp.json ./.cursor/mcp.json

   # Claude Desktop (copy content into your platform-specific config file)
   cat ./examples/mcp-configs/claude_desktop_config.json
   ```

4. **Configure your AI client (paths overview):**
   - **Claude Code**: Add to `.mcp.json` at project root
   - **Claude Desktop**: Add to your platform's config file
   - **Cursor**: Add to `~/.cursor/mcp.json` or `.cursor/mcp.json`

5. **Test the setup:**
   ```bash
   npx design-system-mcp validate
   ```
   Or with the bundled samples without copying them:
   ```bash
   DESIGN_TOKENS_PATH=./examples/tokens npx design-system-mcp validate
   ```

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

## License

MIT