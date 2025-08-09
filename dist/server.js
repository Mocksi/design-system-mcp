import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
// Import our token discovery and parsing utilities
import { discoverDesignTokensWithErrorHandling } from './discovery.js';
import { getCategorySummary } from './parsers/w3c-tokens.js';
// Import validation and error handling
import { validateLayer1Args, validateLayer2Args, validateLayer3Args, validateCategoryExists, validateTokenExists, wrapToolExecution, } from './validation.js';
/**
 * Design System MCP Server
 *
 * Provides three-layer access to W3C Design Tokens:
 * - Layer 1: Discovery (get_design_system_info)
 * - Layer 2: Understanding (get_category_tokens)
 * - Layer 3: Reference (get_token_reference)
 */
class DesignSystemMCPServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'design-system-mcp',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.setupErrorHandler();
    }
    setupToolHandlers() {
        // Register tool list handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_design_system_info',
                        description: `🔍 LAYER 1: DISCOVERY - Start here to explore your design system!

Use this tool to get a high-level overview of all available design token categories. This is your entry point into the design system - it shows what token categories exist (colors, typography, spacing, etc.) and how many tokens are in each category.

When to use:
- Starting to explore a design system
- Need to understand what token categories are available  
- Want a summary of the entire token collection
- Checking if your token setup is working correctly

What you'll get:
- List of all token categories with counts
- Health check of your token setup
- Next steps to dive deeper into specific categories
- Setup recommendations and warnings

Progressive flow: Use this first, then use get_category_tokens to explore specific categories.`,
                        inputSchema: {
                            type: 'object',
                            properties: {
                                directory: {
                                    type: 'string',
                                    description: 'Optional: Custom token directory path. If not provided, uses DESIGN_TOKENS_PATH environment variable or ./design-system-mcp/tokens',
                                },
                            },
                            additionalProperties: false,
                        },
                    },
                    {
                        name: 'get_category_tokens',
                        description: `📋 LAYER 2: UNDERSTANDING - Explore tokens within a specific category

Use this tool after get_design_system_info to dive deep into a specific token category. This shows all tokens within that category with their values, types, and CSS variables ready for use.

When to use:
- After discovering categories with get_design_system_info
- Need to see all available tokens in a category (e.g., all colors, all spacing values)
- Want to understand the structure within a category
- Looking for the right token for your design needs

What you'll get:
- Complete list of tokens in the category with values
- CSS variables ready to copy and use
- Token types and descriptions
- Usage hints for each token
- Subcategory grouping when applicable

Progressive flow: Use after get_design_system_info, then use get_token_reference for detailed info on specific tokens.

Common categories: "colors", "typography", "spacing", "borders", "shadows", "animations", "components"`,
                        inputSchema: {
                            type: 'object',
                            properties: {
                                category: {
                                    type: 'string',
                                    description: 'The category name to explore. Common values: "colors", "typography", "spacing", "borders", "shadows", "animations", "components"',
                                },
                                directory: {
                                    type: 'string',
                                    description: 'Optional: Custom token directory path',
                                },
                                includeResolved: {
                                    type: 'boolean',
                                    description: 'Optional: Include resolved values for token references/aliases (default: false)',
                                },
                            },
                            required: ['category'],
                            additionalProperties: false,
                        },
                    },
                    {
                        name: 'get_token_reference',
                        description: `🔬 LAYER 3: REFERENCE - Get comprehensive details about a specific token

Use this tool after finding tokens with get_category_tokens to get everything you need to implement a specific token. This provides detailed usage examples, code snippets, related tokens, and multiple format variations.

When to use:
- After finding a specific token with get_category_tokens
- Need detailed implementation guidance for a token
- Want code examples and usage patterns
- Looking for related or alternative tokens
- Need the token in different formats (CSS, Sass, JS, etc.)

What you'll get:
- Complete token information with resolved values
- Ready-to-use code examples in multiple languages/frameworks
- CSS variables, Sass variables, JS constants
- Usage recommendations and accessibility considerations  
- Related tokens and hierarchy information
- Platform-specific integration examples

Progressive flow: Use after get_category_tokens to get detailed information about specific tokens you want to implement.`,
                        inputSchema: {
                            type: 'object',
                            properties: {
                                category: {
                                    type: 'string',
                                    description: 'The category containing the token (from get_category_tokens results)',
                                },
                                name: {
                                    type: 'string',
                                    description: 'The exact token name (from get_category_tokens results). Examples: "colors-primary-500", "typography-heading-large", "spacing-md"',
                                },
                                directory: {
                                    type: 'string',
                                    description: 'Optional: Custom token directory path',
                                },
                                includeExamples: {
                                    type: 'boolean',
                                    description: 'Optional: Include code examples (default: true)',
                                },
                                includeRelated: {
                                    type: 'boolean',
                                    description: 'Optional: Include related token suggestions (default: true)',
                                },
                            },
                            required: ['category', 'name'],
                            additionalProperties: false,
                        },
                    },
                ],
            };
        });
        // Register tool execution handler with comprehensive error handling
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'get_design_system_info':
                        return await wrapToolExecution('get_design_system_info', this.handleGetDesignSystemInfo.bind(this), validateLayer1Args)(args);
                    case 'get_category_tokens':
                        return await wrapToolExecution('get_category_tokens', this.handleGetCategoryTokens.bind(this), validateLayer2Args)(args);
                    case 'get_token_reference':
                        return await wrapToolExecution('get_token_reference', this.handleGetTokenReference.bind(this), validateLayer3Args)(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}. Available tools: get_design_system_info, get_category_tokens, get_token_reference`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                // Handle unexpected errors with context
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Tool execution failed for "${name}": ${errorMessage}. Please check your parameters and try again.`);
            }
        });
    }
    async handleGetDesignSystemInfo(args) {
        // Validation is now handled by wrapToolExecution
        const { directory } = args;
        try {
            const { result, fileErrors, healthCheck } = discoverDesignTokensWithErrorHandling(directory);
            // Check for critical errors that prevent discovery
            if (!healthCheck.isHealthy) {
                const criticalErrors = healthCheck.errors.filter(e => e.type === 'DIRECTORY_NOT_FOUND' ||
                    e.type === 'NO_TOKEN_FILES' ||
                    e.type === 'DIRECTORY_NOT_ACCESSIBLE');
                if (criticalErrors.length > 0) {
                    const errorMessages = criticalErrors.map(e => `${e.message}${e.suggestion ? ` Suggestion: ${e.suggestion}` : ''}`);
                    throw new McpError(ErrorCode.InvalidRequest, `Cannot access design tokens: ${errorMessages.join('; ')}`);
                }
            }
            // Build response
            const summary = getCategorySummary(result.parsedResult.categories);
            const categoryDetails = result.parsedResult.categories.map(cat => ({
                name: cat.name,
                displayName: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
                tokenCount: cat.totalCount,
                description: this.getCategoryDescription(cat.name),
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            summary,
                            directory: result.directory,
                            fileCount: result.files.length,
                            categories: categoryDetails,
                            totalTokens: result.parsedResult.allTokens.length,
                            warnings: healthCheck.warnings,
                            nextSteps: [
                                'Use get_category_tokens to explore tokens in a specific category',
                                'Use get_token_reference to get detailed information about specific tokens',
                            ],
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to discover design tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetCategoryTokens(args) {
        // Validation is now handled by wrapToolExecution
        const { category, directory, includeResolved } = args;
        try {
            const { result } = discoverDesignTokensWithErrorHandling(directory);
            const categoryData = result.parsedResult.categories.find(cat => cat.name === category);
            if (!categoryData) {
                const availableCategories = result.parsedResult.categories.map(c => c.name);
                validateCategoryExists(category, availableCategories);
            }
            // Format tokens for response
            const tokens = (categoryData?.tokens || []).map(token => ({
                name: token.name,
                path: token.path,
                value: token.value,
                type: token.type,
                description: token.description,
                cssVariable: `--${token.name.replace(/\./g, '-')}`,
                usage: this.getTokenUsageHint(token.type, token.path),
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            category: {
                                name: categoryData?.name || category,
                                displayName: category.charAt(0).toUpperCase() + category.slice(1),
                                description: this.getCategoryDescription(category),
                                tokenCount: categoryData?.totalCount ?? tokens.length,
                            },
                            tokens,
                            nextSteps: [
                                'Use get_token_reference for detailed information about specific tokens',
                                'Reference tokens in your code using the provided CSS variables or values',
                            ],
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get category tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetTokenReference(args) {
        // Validation is now handled by wrapToolExecution
        const { category, name, directory, includeExamples, includeRelated } = args;
        try {
            const { result } = discoverDesignTokensWithErrorHandling(directory);
            const categoryData = result.parsedResult.categories.find(cat => cat.name === category);
            if (!categoryData) {
                const availableCategories = result.parsedResult.categories.map(c => c.name);
                validateCategoryExists(category, availableCategories);
            }
            const token = categoryData?.tokens?.find(t => t.name === name);
            if (!token) {
                const availableTokens = (categoryData?.tokens || []).map(t => t.name);
                validateTokenExists(name, category, availableTokens);
            }
            // Build detailed token reference
            const tokenReference = {
                name: token.name,
                path: token.path,
                category: category,
                value: token.value,
                type: token.type,
                description: token.description,
                cssVariable: `--${token.name.replace(/\./g, '-')}`,
                cssClass: `.${token.name.replace(/\./g, '-')}`,
                sassVariable: `$${token.name.replace(/\./g, '-')}`,
                usage: this.getTokenUsageHint(token.type, token.path),
                examples: this.getTokenExamples(token.type, token.value, token.name),
                relatedTokens: this.findRelatedTokens(token, categoryData.tokens),
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            token: tokenReference,
                            nextSteps: [
                                'Copy the CSS variable or value to use in your code',
                                'Check related tokens for consistent design patterns',
                                'Use get_category_tokens to explore other tokens in this category',
                            ],
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get token reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getCategoryDescription(category) {
        const descriptions = {
            colors: 'color tokens including primitives, semantic colors, and themed variations',
            typography: 'Font families, weights, sizes, and composite typography tokens',
            spacing: 'Spacing and sizing tokens for margins, padding, and layout',
            borders: 'Border styles, widths, and composite border tokens',
            shadows: 'Box shadow and elevation tokens',
            animations: 'Duration, easing, and transition tokens',
            components: 'Component-specific token collections',
        };
        return descriptions[category] || `${category} design tokens`;
    }
    getTokenUsageHint(type, path) {
        if (!type)
            return 'General purpose token';
        const usageHints = {
            color: 'Use for text, backgrounds, borders, and other color properties',
            dimension: 'Use for spacing, sizing, and layout dimensions',
            fontFamily: 'Use for font-family CSS property',
            fontWeight: 'Use for font-weight CSS property',
            typography: 'Use for complete text styling (font, size, weight, line-height)',
            border: 'Use for border CSS shorthand property',
            shadow: 'Use for box-shadow CSS property',
            duration: 'Use for animation and transition durations',
            cubicBezier: 'Use for animation and transition timing functions',
        };
        return usageHints[type] || `Use for ${type} properties`;
    }
    getTokenExamples(type, value, name) {
        if (!type || !name)
            return [];
        const examples = {
            color: (value, name) => [
                `color: var(--${name});`,
                `background-color: var(--${name});`,
                `border-color: var(--${name});`,
            ],
            dimension: (value, name) => [
                `margin: var(--${name});`,
                `padding: var(--${name});`,
                `width: var(--${name});`,
            ],
            fontFamily: (value, name) => [
                `font-family: var(--${name});`,
            ],
            fontWeight: (value, name) => [
                `font-weight: var(--${name});`,
            ],
            typography: (value, name) => [
                `font: var(--${name});`,
                `@apply ${name.replace(/\./g, '-')};`,
            ],
            border: (value, name) => [
                `border: var(--${name});`,
                `outline: var(--${name});`,
            ],
            shadow: (value, name) => [
                `box-shadow: var(--${name});`,
                `filter: drop-shadow(var(--${name}));`,
            ],
        };
        const generator = examples[type];
        return generator ? generator(value, name.replace(/\./g, '-')) : [];
    }
    findRelatedTokens(currentToken, allTokens) {
        // Find tokens with similar paths or names
        const related = allTokens
            .filter(token => token.name !== currentToken.name && (token.path[0] === currentToken.path[0] || // Same top-level category
            token.type === currentToken.type || // Same type
            this.hasSimilarName(token.name, currentToken.name) // Similar name
        ))
            .slice(0, 5) // Limit to 5 related tokens
            .map(token => token.name);
        return related;
    }
    hasSimilarName(name1, name2) {
        const parts1 = name1.split('-');
        const parts2 = name2.split('-');
        // Check if they share at least 2 name parts
        const commonParts = parts1.filter(part => parts2.includes(part));
        return commonParts.length >= 2;
    }
    setupErrorHandler() {
        this.server.onerror = (error) => {
            console.error('[MCP Server Error]', error);
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Design System MCP Server running on stdio');
    }
}
// Export for testing
export { DesignSystemMCPServer };
// Run server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new DesignSystemMCPServer();
    server.run().catch(console.error);
}
