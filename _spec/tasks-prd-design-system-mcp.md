## Relevant Files

- `src/server.ts` - Main MCP server implementation with three-layer tool registration
- `src/server.test.ts` - Unit tests for MCP server functionality
- `src/parsers/w3c-tokens.ts` - W3C Design Token JSON parser and validator
- `src/parsers/w3c-tokens.test.ts` - Unit tests for token parsing logic
- `src/discovery.ts` - Token file location and loading
- `src/discovery.test.ts` - Unit tests for file discovery
- `src/tools/get-design-system-info.ts` - Layer 1: Discovery tool implementation
- `src/tools/get-category-tokens.ts` - Layer 2: Understanding tool implementation  
- `src/tools/get-token-reference.ts` - Layer 3: Reference tool implementation
- `src/tools/tools.test.ts` - Unit tests for all MCP tools
- `package.json` - Project dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration with testing setup
- `examples/tokens/` - Sample W3C Design Token files bundled in repository
  - `examples/tokens/colors-primitives.json` - Sample primitive color tokens
  - `examples/tokens/colors-semantic.json` - Sample semantic color tokens
  - `examples/tokens/typography.json` - Sample typography tokens  
  - `examples/tokens/spacing.json` - Sample spacing tokens
  - `examples/tokens/components.json` - Sample component tokens
- `examples/mcp-configs/.mcp.json` - Claude Code MCP configuration example (project root)
- `examples/mcp-configs/claude_desktop_config.json` - Claude Desktop MCP configuration example  
- `examples/mcp-configs/.cursor-mcp.json` - Cursor MCP configuration example (global/project)
- `bin/validate.js` - Basic validation command entry point (`npx design-system-mcp validate`) 
- `bin/start.js` - MCP server entry point (`npx design-system-mcp start`)
- `src/commands/validate.ts` - Simple validation command implementation
- `README.md` - Setup and usage documentation

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npm test` or `npx vitest [optional/path/to/test/file]` to run tests
- The project follows the three-layer MCP architecture pattern established by Square MCP
- Focus on read-only operations - no file modification or Git integration

## Tasks

- [ ] 1.0 Project Setup & Infrastructure
  - [ ] 1.1 Initialize TypeScript project with proper tsconfig.json
  - [ ] 1.2 Set up package.json with MCP SDK dependencies (@modelcontextprotocol/sdk, zod)
  - [ ] 1.3 Configure Vite for testing with Vitest and TypeScript support
  - [ ] 1.4 Set up ESLint and Prettier for code quality
  - [ ] 1.5 Create basic project directory structure (src/, examples/)
  - [ ] 1.6 Set up GitHub repository with clear README
  
- [ ] 2.0 W3C Design Token Parser & Validator
  - [ ] 2.1 Implement W3C Design Token JSON schema validation using Zod (latest specification)
  - [ ] 2.2 Create token file parser that handles multiple files and merges token categories
  - [ ] 2.3 Build token categorization logic (colors, typography, spacing, etc.)
  - [ ] 2.4 Implement token reference resolution (aliases and $value references)
  - [ ] 2.5 Add comprehensive error handling for malformed token files
  - [ ] 2.6 Write unit tests covering all token parsing scenarios
  
- [ ] 3.0 Token File Management
  - [ ] 3.1 Implement token directory scanning and multi-file loading (scans ./tokens/*.json)
  - [ ] 3.2 Handle missing/corrupted files with helpful error messages
  - [ ] 3.3 Write tests for all file management scenarios including multiple files per category
  
- [ ] 4.0 MCP Server Implementation (Three-Layer Architecture)
  - [ ] 4.1 Set up basic MCP server with stdio transport
  - [ ] 4.2 Implement Layer 1: get_design_system_info tool (discovery)
  - [ ] 4.3 Implement Layer 2: get_category_tokens tool (understanding)
  - [ ] 4.4 Implement Layer 3: get_token_reference tool (reference)
  - [ ] 4.5 Add proper tool descriptions to guide AI layer progression
  - [ ] 4.6 Implement error handling and validation across all tools
  - [ ] 4.7 Write comprehensive unit tests for each MCP tool
  
- [ ] 5.0 Developer Onboarding
  - [ ] 5.1 Bundle sample W3C Design Token files in repository organized by category (colors-primitives.json, colors-semantic.json, typography.json, spacing.json, components.json)
  - [ ] 5.2 Create example MCP client configuration files: Claude Code (.mcp.json), Claude Desktop (claude_desktop_config.json), Cursor (.cursor/mcp.json)
  - [ ] 5.3 Add basic validation command (npx design-system-mcp validate) that outputs: token files found and categories discovered
  - [ ] 5.4 Write unit tests for validation functionality
  
- [ ] 6.0 Distribution & Documentation
  - [ ] 6.1 Create clear README with simple setup process (copy examples, configure client)
  - [ ] 6.2 Document how to replace sample tokens with team's actual design system
  - [ ] 6.3 Document supported token creation workflows (Figma Tokens, Style Dictionary, etc.)
  - [ ] 6.4 Add concrete before/after AI conversation examples showing value
  - [ ] 6.5 Set up npm package publishing with proper bin entry points (validate, start)
  - [ ] 6.6 Add MCP server entry point (bin/start.js) for `npx design-system-mcp start` used by AI clients