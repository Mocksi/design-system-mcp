import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { discoverDesignTokensWithErrorHandling } from '../discovery.js';
import { getCategoryInfo, resolveTokenReferences } from '../parsers/w3c-tokens.js';
export const CategoryTokensArgsSchema = z.object({
    category: z.string(),
    directory: z.string().optional(),
    includeResolved: z.boolean().optional(),
});
export async function getCategoryTokens(args) {
    const { category, directory, includeResolved = false } = CategoryTokensArgsSchema.parse(args);
    try {
        const { result } = discoverDesignTokensWithErrorHandling(directory);
        // Find the requested category
        const categoryData = result.parsedResult.categories.find(cat => cat.name === category);
        if (!categoryData) {
            const availableCategories = result.parsedResult.categories.map(c => c.name);
            throw new McpError(ErrorCode.InvalidRequest, `Category "${category}" not found. Available categories: ${availableCategories.join(', ')}`);
        }
        // Get category information
        const categoryInfo = getCategoryInfo(category);
        // Process tokens
        const tokens = categoryData.tokens;
        let resolvedByName;
        if (includeResolved) {
            const resolved = resolveTokenReferences(tokens);
            resolvedByName = new Map(resolved.map(rt => [rt.name, rt]));
        }
        // Format tokens for response
        const tokenSummaries = tokens.map((token) => {
            const resolved = includeResolved ? resolvedByName.get(token.name) : undefined;
            return {
                name: token.name,
                path: token.path,
                value: token.value,
                resolvedValue: resolved && resolved.resolvedValue !== token.value ? resolved.resolvedValue : undefined,
                type: token.type,
                description: token.description,
                cssVariable: generateCSSVariable(token.name),
                usage: getTokenUsageHint(token.type, token.path),
                subcategory: getSubcategory(token.path),
            };
        });
        // Group tokens by subcategory if applicable
        const subcategories = groupTokensBySubcategory(tokenSummaries);
        const hasSubcategories = Object.keys(subcategories).length > 1;
        // Generate statistics
        const statistics = generateCategoryStatistics(tokens, includeResolved ? Array.from(resolvedByName.values()) : []);
        // Prepare next steps
        const nextSteps = generateNextSteps(category, tokenSummaries);
        return {
            success: true,
            category: {
                name: categoryData.name,
                displayName: categoryInfo.displayName,
                description: categoryInfo.description,
                icon: categoryInfo.icon,
                tokenCount: categoryData.totalCount,
            },
            tokens: tokenSummaries,
            subcategories: hasSubcategories ? subcategories : undefined,
            statistics,
            nextSteps,
        };
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to get category tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function generateCSSVariable(tokenName) {
    return `--${tokenName.replace(/\./g, '-')}`;
}
function getTokenUsageHint(type, path) {
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
    // Add context based on path
    const contextHints = {
        primary: 'Primary brand color for main actions and emphasis',
        secondary: 'Secondary color for supporting elements',
        error: 'Error states and destructive actions',
        warning: 'Warning states and cautions',
        success: 'Success states and positive feedback',
        neutral: 'Neutral tones for text and backgrounds',
    };
    let hint = usageHints[type] || `Use for ${type} properties`;
    if (path && path.length > 1) {
        const pathKey = path[1].toLowerCase();
        if (contextHints[pathKey]) {
            hint = `${contextHints[pathKey]} - ${hint}`;
        }
    }
    return hint;
}
function getSubcategory(path) {
    if (path.length >= 2) {
        return path[1]; // Second level is typically the subcategory
    }
    return undefined;
}
function groupTokensBySubcategory(tokens) {
    const groups = {};
    for (const token of tokens) {
        const subcategory = token.subcategory || 'other';
        if (!groups[subcategory]) {
            groups[subcategory] = [];
        }
        groups[subcategory].push(token);
    }
    return groups;
}
function generateCategoryStatistics(tokens, resolvedTokens) {
    // Count tokens by type
    const tokensByType = {};
    tokens.forEach(token => {
        const type = token.type || 'unknown';
        tokensByType[type] = (tokensByType[type] || 0) + 1;
    });
    const statistics = {
        totalTokens: tokens.length,
        tokensByType,
    };
    if (resolvedTokens.length > 0) {
        statistics.resolvedTokens = resolvedTokens.filter(t => t.isResolved).length;
        statistics.unresolvedReferences = resolvedTokens.filter(t => !t.isResolved).length;
    }
    return statistics;
}
function generateNextSteps(category, tokens) {
    const nextSteps = [];
    // General next steps (first entries to satisfy tests)
    nextSteps.push('Use get_token_reference for detailed information about specific tokens');
    nextSteps.push('Copy CSS variables or values to use in your code');
    nextSteps.push('Use get_design_system_info to explore other token categories');
    // Category-specific guidance
    const categoryGuidance = {
        colors: [
            'Consider using semantic color names (primary, secondary) over literal names (blue, red)',
            'Check for color contrast compliance when using these tokens',
        ],
        typography: [
            'typography tokens provide complete text styling - use them for consistent text hierarchy',
            'Consider combining typography tokens with color tokens for complete text styling',
        ],
        spacing: [
            'Use spacing tokens consistently for margins, padding, and gaps',
            'Consider using spacing tokens for component dimensions to maintain design consistency',
        ],
        components: [
            'Component tokens are pre-configured for specific UI elements',
            'These tokens help maintain consistency across component instances',
        ],
    };
    if (categoryGuidance[category]) {
        // Add up to 2 guidance items to keep total length predictable
        nextSteps.push(...categoryGuidance[category].slice(0, 2));
    }
    return nextSteps;
}
// Helper function for filtering tokens
export function filterTokens(tokens, filters) {
    return tokens.filter(token => {
        if (filters.type && token.type !== filters.type)
            return false;
        if (filters.subcategory && token.subcategory !== filters.subcategory)
            return false;
        if (filters.hasDescription !== undefined && !!token.description !== filters.hasDescription)
            return false;
        if (filters.nameContains && !token.name.toLowerCase().includes(filters.nameContains.toLowerCase()))
            return false;
        return true;
    });
}
// Helper function for sorting tokens
export function sortTokens(tokens, sortBy = 'name') {
    return [...tokens].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'type':
                return (a.type || '').localeCompare(b.type || '');
            case 'subcategory':
                return (a.subcategory || '').localeCompare(b.subcategory || '');
            case 'path':
                return a.path.join('.').localeCompare(b.path.join('.'));
            default:
                return 0;
        }
    });
}
// Helper function to validate category name
export function validateCategoryName(category) {
    const issues = [];
    if (!category || category.trim() === '') {
        issues.push('Category name is required');
    }
    if (category && category !== category.toLowerCase()) {
        issues.push('Category names should be lowercase for consistency');
    }
    if (category && /[^a-z0-9-_]/.test(category)) {
        issues.push('Category names should only contain lowercase letters, numbers, hyphens, and underscores');
    }
    return issues;
}
// Format category tokens response for different output types
export function formatCategoryResponse(result, format = 'json') {
    switch (format) {
        case 'table':
            const headers = ['Token Name', 'Type', 'Value', 'CSS Variable'];
            const rows = result.tokens.map(token => [
                token.name,
                token.type || 'unknown',
                typeof token.value === 'string' ? token.value : JSON.stringify(token.value),
                token.cssVariable
            ]);
            return formatTable(headers, rows);
        case 'list':
            const lines = [
                `${result.category.icon || '📋'} ${result.category.displayName} (${result.category.tokenCount} tokens)`,
                result.category.description,
                '',
            ];
            result.tokens.forEach(token => {
                lines.push(`• ${token.name}: ${typeof token.value === 'string' ? token.value : JSON.stringify(token.value)}`);
                if (token.description) {
                    lines.push(`  ${token.description}`);
                }
                lines.push(`  CSS: ${token.cssVariable}`);
                lines.push('');
            });
            return lines.join('\n');
        case 'json':
        default:
            return JSON.stringify(result, null, 2);
    }
}
function formatTable(headers, rows) {
    const colWidths = headers.map((header, i) => Math.max(header.length, ...rows.map(row => (row[i] || '').length)));
    const formatRow = (row) => row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ');
    const separator = colWidths.map(width => '-'.repeat(width)).join('-+-');
    return [
        formatRow(headers),
        separator,
        ...rows.map(formatRow),
    ].join('\n');
}
