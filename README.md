# Design System MCP

> 🎨 **Model Context Protocol server that gives AI assistants direct access to your design tokens**

Prevent AI assistants from hallucinating design tokens by giving them read‑only access to your W3C Design Token JSON files. No more `#ff0000` when you have a perfectly good `colors.primary.500` token.

[![npm version](https://img.shields.io/npm/v/design-system-mcp)](https://www.npmjs.com/package/design-system-mcp) [![npm downloads](https://img.shields.io/npm/dm/design-system-mcp)](https://www.npmjs.com/package/design-system-mcp) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

## 🚀 Setup (2 minutes)

**Requirements:** Node >= 18 • Compatible with Claude Code, Cursor, Claude Desktop

1. **Install:**
   ```bash
   npm install -g design-system-mcp
   ```

2. **Initialize sample tokens:**
   ```bash
   design-system-mcp init
   ```
   Output:
   ```
   ✓ Copied sample tokens to ./design-system-mcp/tokens/
   ✓ Ready to test!
   ```

3. **Validate the setup:**
   ```bash
   design-system-mcp validate
   ```
   Output:
   ```
   ✓ Token files found: 5 files in ./design-system-mcp/tokens
   ✓ Categories discovered: colors, typography, spacing, components
   ```

4. **Configure your AI client** (see MCP Client Configuration below)

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

## 📦 Installation

| Method | Command | When to use |
|--------|---------|-------------|
| **Project-local** | `npm install design-system-mcp` | Recommended for team projects |
| **Global** | `npm install -g design-system-mcp` | Personal use across projects |

Both methods work with `npx design-system-mcp` - no difference in usage.

## ✨ Features

- 🚫 **Stop token hallucination** - AI uses your actual design tokens, not made-up values
- 📁 **Multi-file support** - Merge tokens from multiple JSON files automatically  
- 🔄 **Token references** - Resolve `{colors.primary}` aliases between tokens
- ✅ **Validation** - Catch malformed tokens before AI sees them
- 🔧 **Tool integration** - Works with Figma Tokens, Style Dictionary, manual JSON
- 🔒 **Read-only access** - AI can discover and use tokens but never modify them

## 🎯 Why this exists

- Ensures AI assistants use your real tokens instead of hallucinating values
- Normalizes various token sources (Figma Tokens, Style Dictionary, manual JSON) into W3C JSON
- Adds validation, discovery, and safe read‑only access via the MCP protocol

## Next steps

After testing with sample tokens, replace them with your design system:

1. **Replace sample tokens:**
   - Put your W3C Design Token JSON files in `./design-system-mcp/tokens/`
   - Or use `DESIGN_TOKENS_PATH=./your/tokens` to point elsewhere

2. **Validate your tokens:**
   ```bash
   design-system-mcp validate
   ```

3. **Configure your AI client** (see MCP Client Configuration section below)

## 📄 Token File Format

This MCP server works with **W3C Design Token JSON** files. Place your token files in `./design-system-mcp/tokens/` (or set `DESIGN_TOKENS_PATH`):

### File Structure
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

### Key Conventions
- **Format**: W3C Design Tokens (community group spec)
- **Structure**: One or many `.json` files with categories like `colors`, `typography`, `spacing`, `components`
- **Discovery**: All `.json` files under `DESIGN_TOKENS_PATH` are merged by category
- **Aliases**: Reference other tokens with `{path.to.token}` syntax (e.g., `"$value": "{colors.primary.500}"`)

---

## ⚙️ MCP Client Configuration

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

## 💬 Usage Examples

Once configured, your AI assistant has access to your design tokens. Here are some example interactions:

### 🔍 Discovery
**You:** "What colors are available in our design system?"  
**AI:** *Lists all color categories and tokens from your JSON files*

**You:** "Show me all typography tokens with their values"  
**AI:** *Displays typography tokens with font families, sizes, weights, etc.*

### 🎨 Component Development
**You:** "Create a React button component using our design system tokens"  
**AI:** 
```jsx
const Button = ({ variant = 'primary', children }) => (
  <button 
    style={{
      backgroundColor: 'var(--colors-primary-500)', // Uses your actual token
      color: 'var(--colors-neutral-50)',
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontFamily: 'var(--typography-body-fontFamily)',
      fontSize: 'var(--typography-body-fontSize)',
      borderRadius: 'var(--radius-md)'
    }}
  >
    {children}
  </button>
);
```

### 🔧 Token Debugging  
**You:** "What's the exact hex value of our primary-500 color?"  
**AI:** *Returns the exact value from your token files, e.g., "#3b82f6"*

**You:** "Are there any typography tokens that reference other tokens?"  
**AI:** *Shows tokens with `{path.to.token}` references and their resolved values*

---

## 🔄 Replacing Sample Tokens

Ready to use your real tokens? Here's how:

### 📁 Token Location Options

| Option | Path | Configuration |
|--------|------|---------------|
| **Default** | `./design-system-mcp/tokens/` | No setup needed |
| **Custom** | Any folder | Set `DESIGN_TOKENS_PATH` env variable |

**Example with custom path:**
```bash
DESIGN_TOKENS_PATH=./path/to/your/tokens npx design-system-mcp validate
```

### 🗂️ Supported File Layouts

| Layout | Example | Benefits |
|--------|---------|----------|
| **Single file** | `tokens.json` | Simple for small token sets |
| **Multiple files** ⭐ | `colors.json`, `typography.json`, `spacing.json` | Better organization, team collaboration |

The server automatically discovers all `.json` files and merges categories.

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

### Validate Your Token Setup

1. **Test your tokens:** `npx design-system-mcp validate`
2. **Expected success output:**
   ```
   ✓ Token files found: 3 files in ./design-system-mcp/tokens
   ✓ Categories discovered: colors, typography, spacing
   ✓ All tokens have valid W3C format
   ```
3. **If no tokens found:** Verify the directory exists and contains `.json` files, or set `DESIGN_TOKENS_PATH`

### Quick checklist

- Tokens are in your selected directory (default `./design-system-mcp/tokens/`)
- Files end with `.json` and contain valid JSON
- Top‑level categories use standard names (`colors`, `typography`, `spacing`, `components`, ...)
- Optional: references use `{...}` syntax and point to existing tokens
- Validation shows files and expected categories

---

## 🔧 Token Creation Workflows

| Tool | Process | Notes |
|------|---------|-------|
| **Figma Tokens** | Export → W3C JSON → Copy to tokens folder | Use `{path.to.token}` aliases |
| **Style Dictionary** | Build → W3C JSON output → Point `DESIGN_TOKENS_PATH` | Keep aliases in output |
| **Design Token Studio** | Export → W3C JSON → Copy to folder | - |
| **Manual JSON** | Write JSON files → Follow W3C format | See examples above |

### Quick Setup: Figma Tokens

1. Export your tokens as W3C JSON format
2. Copy files to `./design-system-mcp/tokens/`
3. **Test the setup:** `npx design-system-mcp validate` (checks file format and discovery)


---

## 🛠️ Commands

| Command | Purpose |
|---------|---------|
| `design-system-mcp init` | Copy sample tokens to ./design-system-mcp/tokens/ |
| `design-system-mcp validate` | Check token files are valid W3C format and discoverable |
| `design-system-mcp start` | Start the MCP server (used by AI clients) |

### Command Examples

**Initialize sample tokens:**
```bash
$ design-system-mcp init
✓ Copied sample tokens to ./design-system-mcp/tokens/
✓ Ready to test!
```

**Validate token setup:**
```bash
$ design-system-mcp validate
✓ Token files found: 5 files in ./design-system-mcp/tokens
✓ Categories discovered: colors, typography, spacing, components
```

---

## 🔍 Troubleshooting

### No tokens found
```
No tokens found in ./design-system-mcp/tokens/. 
```

**Solutions:**
- Install the package first: `npm install design-system-mcp`
- Then copy sample tokens: `cp -r node_modules/design-system-mcp/examples/tokens ./design-system-mcp/`
- Or test with built-in examples: `DESIGN_TOKENS_PATH=node_modules/design-system-mcp/examples/tokens npx design-system-mcp validate` (verifies token format)

### AI client can't connect
1. Restart your AI client completely after configuration changes
2. Check that the config file is in the correct location for your platform
3. Verify the token directory path in your configuration

### Invalid token files
The validate command will show specific errors:
```
colors.json line 15: Missing required '$type' field for token 'primary-500'
```

## ❓ FAQ

<details>
<summary><strong>Where do my tokens go?</strong></summary>
Default: <code>./design-system-mcp/tokens/</code>. Or set <code>DESIGN_TOKENS_PATH</code> to any folder with W3C Design Token JSON files.
</details>

<details>
<summary><strong>Do I need Figma Tokens or Style Dictionary?</strong></summary>
No. Any valid W3C Design Token JSON works. Those tools are just convenient producers.
</details>

<details>
<summary><strong>Can I split tokens across multiple files?</strong></summary>
Yes. All <code>.json</code> files under <code>DESIGN_TOKENS_PATH</code> are discovered and merged by category.
</details>

<details>
<summary><strong>How do aliases work?</strong></summary>
Use <code>{path.to.token}</code> in <code>"$value"</code>. Aliases can be resolved when returning category/token data.
</details>

<details>
<summary><strong>How do I test the MCP server without setting up my own tokens?</strong></summary>
Use the built-in sample tokens to validate the setup works:

```bash
# Test with built-in examples (automatic)
npx design-system-mcp validate

# Or explicitly point to installed examples  
DESIGN_TOKENS_PATH=node_modules/design-system-mcp/examples/tokens npx design-system-mcp validate
```

Both will show you what successful validation looks like before you add your own tokens.
</details>

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