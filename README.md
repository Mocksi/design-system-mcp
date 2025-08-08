# Design System MCP

A focused Model Context Protocol server that prevents AI coding assistants from hallucinating design tokens by providing direct access to W3C Design Token JSON files.

## Quick Start

1. **Install the package:**
   ```bash
   npm install -g design-system-mcp
   ```

2. **Copy sample tokens:**
   ```bash
   cp -r node_modules/design-system-mcp/examples/tokens ./design-system-mcp/
   ```

3. **Configure your AI client:**
   - **Claude Code**: Add to `.mcp.json` at project root
   - **Claude Desktop**: Add to your platform's config file
   - **Cursor**: Add to `~/.cursor/mcp.json` or `.cursor/mcp.json`

4. **Test the setup:**
   ```bash
   npx design-system-mcp validate
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

1. Replace the sample token files in `./design-system-mcp/tokens/` with your actual design system tokens
2. Ensure your token files follow the W3C Design Token specification
3. Run `npx design-system-mcp validate` to verify the setup

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