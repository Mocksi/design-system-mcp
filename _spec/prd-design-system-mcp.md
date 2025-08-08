# Product Requirements Document: Design System MCP

## Introduction/Overview

The Design System MCP is a focused Model Context Protocol server that prevents AI coding assistants from hallucinating design tokens by providing direct access to W3C Design Token JSON files. This simple, three-layer MCP server enables AI assistants to discover, understand, and reference actual design system tokens during development conversations.

**Problem Statement**: AI coding assistants frequently hallucinate colors, typography, and other design tokens, especially when working with Tailwind CSS, leading to design inconsistencies and drift from established design systems.

## Goals

1. **Eliminate AI Hallucination**: Provide AI assistants with authoritative access to actual design system tokens instead of guessing values
2. **Simple Integration**: Work seamlessly with existing design token workflows without replacing existing tools
3. **Universal MCP Compatibility**: Work with any MCP-compatible AI assistant (Cursor, Claude Code, Claude Desktop, etc.)
4. **Zero-Maintenance**: Require minimal setup and maintenance for development teams

## User Stories

**As a developer using AI assistance:**
- I want AI to reference actual design tokens from my design system instead of making up colors/values
- I want to ask "What colors are available?" and get real token names and values
- I want AI to suggest proper token names when I'm building components

**As a design system maintainer:**
- I want developers to use AI assistance that knows our actual design system
- I want the MCP to work with our existing W3C Design Token JSON files without modification

## Conversation Flow Examples

### Example 1: Component Design System Compliance
**Developer Request**: "Help me make this button component use our design system"

**AI Layer Progression**:
1. **Layer 1 (Discovery)**: `get_design_system_info()` 
   - **Response**: "Found 3 categories: colors (12 tokens), typography (8 scales), spacing (6 values)"

2. **Layer 2 (Understanding)**: `get_category_tokens(category: "colors")`
   - **Response**: 
   ```json
   {
     "primary": {
       "50": "#eff6ff", "500": "#3b82f6", "900": "#1e3a8a"
     },
     "error": {
       "500": "#ef4444", "600": "#dc2626"
     }
   }
   ```

3. **Layer 3 (Reference)**: `get_token_reference(category: "colors", name: "primary-500")`
   - **Response**: 
   ```json
   {
     "name": "primary-500",
     "value": "#3b82f6",
     "cssVar": "--color-primary-500",
     "usage": "Primary actions, links, focus states"
   }
   ```

### Example 2: Token Discovery
**Developer Request**: "What spacing tokens do we have available?"

**AI Layer Progression**:
1. **Layer 1**: Discovers spacing category exists
2. **Layer 2**: Gets all spacing tokens and their values
3. **Layer 3**: Shows specific token details when requested

**Final Response**: "Found 8 spacing tokens: xs(0.25rem), sm(0.5rem), md(1rem), lg(1.5rem), xl(2rem), 2xl(3rem), 3xl(4rem), 4xl(6rem)"

## Functional Requirements

### Layer 1: Discovery (`get_design_system_info`)
1. The system must scan and parse multiple W3C Design Token JSON files in the `./design-system-mcp/tokens/` directory
2. The system must return a structured list of available categories (colors, typography, spacing, shadows, etc.)
3. The system must automatically discover and load all .json files in the tokens directory (supports multiple files per category like colors-primitives.json, colors-semantic.json)
4. The system must provide clear category descriptions for AI understanding

### Layer 2: Understanding (`get_category_tokens`)
5. The system must return all available tokens within a specified category
6. The system must include token values and basic metadata
7. The system must validate token structure against W3C Design Token specification
8. The system must resolve token references and aliases

### Layer 3: Reference (`get_token_reference`)
9. The system must return detailed information for a specific token
10. The system must provide token value in multiple formats (hex, RGB, CSS custom property name)
11. The system must include token description and usage information when available
12. The system must validate token exists before returning reference

### Core Requirements
13. The system must work with standard W3C Design Token JSON format exclusively (using latest specification)
14. The system must provide clear, actionable responses for AI assistant consumption
15. The system must handle error cases gracefully (missing files, invalid tokens, etc.)
16. The system must support local file system token sources
17. The system must reload token files on each request (caching not required for MVP)

### Onboarding Requirements
18. The system must bundle sample W3C Design Token JSON files in the repository organized by category (colors-primitives.json, colors-semantic.json, typography.json, spacing.json, components.json)
19. The system must provide clear documentation for MCP client configurations (Claude Code, Claude Desktop, Cursor)
20. The system must provide a basic validation command (`npx design-system-mcp validate`) that outputs: token files found and categories discovered
21. The system must include clear documentation for replacing sample tokens with team's actual design tokens

## Non-Goals (Out of Scope)

- **No code analysis or modification** - MCP only provides token information when AI explicitly requests it
- **No automatic token creation** - Read-only access to existing design token files
- **No export/transform pipeline** - Teams use existing tools (Style Dictionary, Tailwind, etc.)
- **No Git integration** - Simple file reading only
- **No IDE extensions or language servers** - Pure MCP server for AI assistant integration
- **No design tool integration** - Works with W3C Design Token JSON files only
- **No file watching or development servers** - Stateless MCP server invoked on-demand
- **No complex setup commands** - Bundle sample tokens in repository instead of generating them
- **No sophisticated caching** - Direct file reads sufficient for token file sizes
- **No elaborate validation output** - Simple health check adequate for MVP

## MCP Client Integration Specifications

### Claude Code Configuration
**File**: `.mcp.json` (at project root)
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

### Claude Desktop Configuration
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

### Cursor Integration
**Global**: `~/.cursor/mcp.json` or **Project**: `.cursor/mcp.json`
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

### Configuration Requirements
- **Consistent Format**: All clients use `mcpServers` object with same structure
- **Standard Command**: `npx` with `["design-system-mcp", "start"]` args array format
- **Cross-Platform Paths**: Handle different config file locations per OS  
- **Standard Token Directory**: MCP server scans `./design-system-mcp/tokens/` directory for all .json files
- **Multiple File Support**: Automatically loads and merges all .json files in tokens directory (supports organizational patterns like colors-primitives.json, colors-semantic.json)
- **Environment Variables**: `DESIGN_TOKENS_PATH` specifies token directory location
- **Restart Required**: All clients require restart after configuration changes

### Error Handling & Diagnostics
- **Connection Failures**: Clear error messages when MCP server fails to start
- **Token File Not Found**: Helpful guidance for token file location and MCP working directory
- **Invalid Token Files**: Specific validation errors with line numbers and suggestions
- **Config File Issues**: Platform-specific guidance for MCP client configuration paths
- **Configuration Validation**: Use `npx design-system-mcp validate` to test MCP setup
- **Client-Specific Troubleshooting**: 
  - Claude Code: Check `.mcp.json` at project root
  - Claude Desktop: Verify config file location per OS, restart app completely
  - Cursor: Check global `~/.cursor/mcp.json` or project `.cursor/mcp.json`, restart IDE

#### KISS Error Message Guidelines
**Keep error messages simple, actionable, and specific:**
- ❌ "Token validation failed" 
- ✅ "colors.json line 15: Missing required '$type' field for token 'primary-500'"

**Common Error Patterns:**
- **Missing Tokens Directory**: "No tokens found in ./tokens/. Copy sample tokens from design-system-mcp/examples/tokens/ to get started."
- **Invalid JSON**: "colors.json line 8: Expected ',' or '}' after property value"
- **Invalid W3C Format**: "typography.json: Token 'heading-large' missing required '$value' property"
- **Circular References**: "Token 'primary-base' references itself through 'brand-primary' → 'primary-base'"
- **Missing Dependencies**: "Token 'surface-elevated' references undefined token 'colors.neutral.100'"

## Architecture Map

### System Overview
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Design System MCP Architecture                        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────────┐
│   AI Clients    │    │   MCP Server     │    │      Design Token Files        │
│                 │    │                  │    │                                 │
│ • Cursor        │    │  ┌─────────────┐ │    │  ./design-system-mcp/tokens/    │
│ • Claude Code   │◄──►│  │   Layer 1   │ │◄──►│  ├── colors-primitives.json     │
│ • Claude Desktop│    │  │ Discovery   │ │    │  ├── colors-semantic.json       │
│                 │    │  └─────────────┘ │    │  ├── typography.json            │
└─────────────────┘    │  ┌─────────────┐ │    │  ├── spacing.json               │
                       │  │   Layer 2   │ │    │  └── components.json            │
                       │  │Understanding│ │    └─────────────────────────────────┘
                       │  └─────────────┘ │    
                       │  ┌─────────────┐ │    ┌─────────────────────────────────┐
                       │  │   Layer 3   │ │    │         Cache Layer             │
                       │  │ Reference   │ │◄──►│                                 │
                       │  └─────────────┘ │    │  In-Memory Token Cache          │
                       └──────────────────┘    │  • Per-file modification times  │
                                              │  • Parsed token structures      │
                                              └─────────────────────────────────┘
```

### Data Flow Architecture
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MCP Request Flow                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

AI Request: "What colors are available?"
     │
     ▼
┌─────────────────┐
│   Layer 1       │──► get_design_system_info()
│   Discovery     │    • Scan tokens/ directory
│                 │    • Return category summary
└─────────────────┘
     │
     ▼ AI Request: "Show me all color tokens"
┌─────────────────┐
│   Layer 2       │──► get_category_tokens(category: "colors")
│   Understanding │    • Load all color files
│                 │    • Merge and categorize tokens
└─────────────────┘    • Return structured token list
     │
     ▼ AI Request: "Details on primary-500 token"
┌─────────────────┐
│   Layer 3       │──► get_token_reference(category: "colors", name: "primary-500")
│   Reference     │    • Find specific token
│                 │    • Return detailed metadata
└─────────────────┘    • Include usage information
```

### Component Architecture
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Internal Architecture                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Entry Points   │    │     Core MCP     │    │   Token System   │
│                  │    │                  │    │                  │
│ bin/init.js      │    │ src/server.ts    │    │ src/parsers/     │
│ bin/validate.js  │    │ • Tool registry  │    │ • W3C validator  │
│ bin/start.js     │    │ • Request router │    │ • Token parser   │
│                  │    │ • Error handler  │    │ • Reference      │
└──────────────────┘    └──────────────────┘    │   resolver       │
                                               └──────────────────┘
                        ┌──────────────────┐    ┌──────────────────┐
                        │   MCP Tools      │    │  File System     │
                        │                  │    │                  │
                        │ Layer 1: Info    │    │ src/discovery.ts │
                        │ Layer 2: Tokens  │    │ • Directory scan │
                        │ Layer 3: Details │    │ • File loading   │
                        │                  │    │ • Cache mgmt     │
                        └──────────────────┘    └──────────────────┘
```

### Setup & Distribution Architecture
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Developer Experience Flow                             │
└─────────────────────────────────────────────────────────────────────────────────┘

Developer runs: npx design-system-mcp init
     │
     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   npm Package   │    │  Folder Setup   │    │ Config Generate │
│                 │    │                 │    │                 │
│ • Download MCP  │───►│ Create tokens/  │───►│ Generate MCP    │
│ • Install deps  │    │ Copy samples    │    │ client configs  │
│ • Setup bin/    │    │ Create README   │    │ • Claude Code   │
└─────────────────┘    └─────────────────┘    │ • Claude Desktop│
                                              │ • Cursor        │
                                              └─────────────────┘
     │
     ▼
Developer runs: npx design-system-mcp validate
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Validation Flow                              │
│                                                                 │
│ ✅ MCP server executable: bin/start.js found                   │
│ ✅ Tokens directory: ./design-system-mcp/tokens/ (5 files)     │
│ ✅ Parsed tokens: 15 colors, 8 typography, 6 spacing          │
│ ✅ MCP tools: All 3 tools responding correctly                 │
└─────────────────────────────────────────────────────────────────┘
```

## Design Considerations

- **Three-Layer Architecture**: Follows the "ogre pattern" proven by Square MCP for progressive disclosure
- **Stateless Operation**: MCP server invoked on-demand by AI assistants, no persistent state
- **Read-Only Access**: Only reads existing token files, no modifications or file creation
- **No Caching**: Direct file reads on each request (token files are small)

## Technical Considerations

- **Technology Stack**: TypeScript, @modelcontextprotocol/sdk, Zod for validation
- **W3C Compliance**: Strict adherence to W3C Design Token specification
- **Configuration**: Convention-based token file discovery (tokens.json, design-tokens.json)
- **Cross-Platform**: Must work on macOS, Windows, and Linux
- **Package Distribution**: npm package installable via npx
- **Executable Commands**: Package.json bin field must map `validate` to `bin/validate.js` and `start` to `bin/start.js` for npx command functionality

## Success Metrics

### Primary Success Metrics
- **Setup Simplicity**: Developers can configure MCP in under 5 minutes
- **AI Accuracy**: AI assistants reference actual design tokens instead of hallucinating values
- **Cross-Client Compatibility**: Works consistently across Claude Code, Claude Desktop, and Cursor

### Secondary Success Metrics
- **Community Adoption**: GitHub stars, npm downloads indicating usage
- **Issue Resolution**: Low bug reports indicating stable, simple implementation

## Architecture Decisions

### Token File Discovery
**Decision**: Directory scanning for multiple JSON files
- **Primary**: Auto-discover all .json files in `./design-system-mcp/tokens/` directory
- **Rationale**: Real design systems use multiple files (primitives, semantic, components, etc.)

### Scope
**Decision**: Single design system per MCP instance
- **MVP Scope**: Read-only access to one set of design token files
- **Rationale**: Focused, simple implementation

### Performance
**Decision**: No caching - direct file reads on each request
- **Strategy**: Read and parse token files on each MCP tool invocation
- **Rationale**: Design token files are small (<50KB typically), direct reads are fast enough for MVP

## Ecosystem Positioning

**Last Mile Integration**: The Design System MCP serves as the final connection between existing design token workflows and AI assistants. It assumes design tokens already exist in W3C format from established tools:

### Supported Token Creation Workflows
- **Figma Tokens Plugin** → W3C JSON → Design System MCP
- **Style Dictionary** → W3C JSON → Design System MCP  
- **Design Token Studio** → W3C JSON → Design System MCP
- **Manual JSON editing** → W3C JSON → Design System MCP

**Strategic Benefits**:
- **No Workflow Disruption**: Teams keep their existing design token creation process
- **Universal Compatibility**: Works with any tool that outputs W3C Design Token JSON
- **Focused Value**: Solves AI hallucination without rebuilding design token infrastructure

## Developer Onboarding Experience

### Setup Process for Design Engineers
1. **Installation**: `npm install -g design-system-mcp`
2. **Copy Sample Tokens**: Copy example tokens from repository to local `./tokens/` directory
3. **Configure MCP Client**: Add server configuration to your AI client (Claude Code, Desktop, or Cursor)
4. **Basic Validation**: `npx design-system-mcp validate` (shows files found and categories)
5. **Customization**: Replace sample tokens with your design system's actual W3C Design Token JSON files

### Validation Command Output
```
Token files found: 4 files in ./tokens/
Categories discovered: colors, typography, spacing, components
MCP server ready
```

### Repository Structure
```
design-system-mcp/
├── src/                       # MCP server implementation
├── examples/
│   ├── tokens/                # Sample W3C Design Token files (bundled)
│   │   ├── colors-primitives.json
│   │   ├── colors-semantic.json  
│   │   ├── typography.json
│   │   ├── spacing.json
│   │   └── components.json
│   └── mcp-configs/           # Example MCP client configurations
│       ├── .mcp.json          # Claude Code example
│       ├── claude_desktop_config.json
│       └── .cursor-mcp.json
├── README.md                  # Setup instructions
└── package.json
```

### Onboarding Requirements  
- **Bundled Sample Tokens**: Include comprehensive W3C Design Token JSON files in repository
- **Configuration Examples**: Provide working MCP client config examples in repository
- **Simple Validation**: Command to verify basic token file loading
- **Clear Documentation**: README instructions for copying and replacing sample tokens

## Distribution Strategy

**Simple Open Source Package**: Focus on effortless installation and setup
- **npm Package**: `npm install -g design-system-mcp` or `npx design-system-mcp`
- **GitHub Repository**: Source code with clear README and examples
- **Documentation**: Simple setup guide for each MCP client

**Package Features**:
- **Bundled Examples**: Sample W3C Design Token files included in repository
- **Simple Setup**: Copy examples and configure MCP client
- **Basic Validation**: Health check command to verify setup
- **Clear Documentation**: Step-by-step guide for replacing sample tokens