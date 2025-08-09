# MCP Setup Guide

Complete configuration instructions for connecting Design System MCP to your AI client.

## Configuration Template

Replace `[your-path]` with the actual path to your design tokens folder.

```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "[your-path]/tokens"
      }
    }
  }
}
```

**Common paths:**
- `./design-system-mcp/tokens` (default after `design-system-mcp init`)
- `./tokens` (project root)
- `./src/design-system/tokens` (in source folder)
- `/absolute/path/to/your/tokens` (absolute path)

---

## Claude Code

Create `.mcp.json` at your project root:

```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "[your-path]/tokens"
      }
    }
  }
}
```

**Example with actual path:**
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "./src/tokens"
      }
    }
  }
}
```

---

## Claude Desktop

**Configuration file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "[your-path]/tokens"
      }
    }
  }
}
```

**Example with actual path:**
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "/Users/yourname/projects/design-system/tokens"
      }
    }
  }
}
```

---

## Cursor

**Configuration file locations:**
- **Global**: `~/.cursor/mcp.json`
- **Project-specific**: `.cursor/mcp.json` (in project root)

**Configuration:**
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "[your-path]/tokens"
      }
    }
  }
}
```

**Example with actual path:**
```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "./design-tokens"
      }
    }
  }
}
```

---

## Other MCP Clients

For any MCP-compatible client, use this configuration pattern:

```json
{
  "mcpServers": {
    "design_system": {
      "command": "npx",
      "args": ["design-system-mcp", "start"],
      "env": {
        "DESIGN_TOKENS_PATH": "[your-path]/tokens"
      }
    }
  }
}
```

---

## Troubleshooting

### AI client can't connect
1. **Restart your AI client completely** after configuration changes
2. Check that the config file is in the correct location for your platform
3. Verify the token directory path in your configuration exists
4. Run `design-system-mcp validate` to ensure tokens are readable

### Path issues
- Use forward slashes `/` even on Windows
- Relative paths are relative to where the AI client starts (usually project root)
- Absolute paths work on all platforms
- Wrap paths with spaces in quotes: `"C:/Program Files/tokens"`

### Testing your setup
Before configuring your AI client, test that tokens are discoverable:

```bash
# Test with your actual path
DESIGN_TOKENS_PATH=[your-path]/tokens npx design-system-mcp validate

# Expected output:
# ✓ Token files found: X files in [your-path]/tokens
# ✓ Categories discovered: colors, typography, spacing, ...
```

### Common path examples

| Scenario | Path | Configuration |
|----------|------|---------------|
| After `design-system-mcp init` | `./design-system-mcp/tokens` | Default |
| Tokens in project root | `./tokens` | Simple |
| Tokens in src folder | `./src/design-system/tokens` | Organized |
| Absolute path | `/Users/name/project/tokens` | Cross-platform |
| Windows path | `C:/Projects/MyApp/tokens` | Windows |

Remember to replace `[your-path]` with your actual path!