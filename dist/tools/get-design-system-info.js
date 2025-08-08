import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { discoverDesignTokensWithErrorHandling } from '../discovery.js';
import { getCategorySummary, getCategoryInfo } from '../parsers/w3c-tokens.js';
export const DesignSystemInfoArgsSchema = z.object({
    directory: z.string().optional(),
});
export async function getDesignSystemInfo(args) {
    const { directory } = DesignSystemInfoArgsSchema.parse(args);
    try {
        const { result, fileErrors, healthCheck } = discoverDesignTokensWithErrorHandling(directory);
        // Check for critical errors that prevent discovery
        if (!healthCheck.isHealthy) {
            const criticalErrors = healthCheck.errors.filter(e => e.type === 'DIRECTORY_NOT_FOUND' ||
                e.type === 'NO_TOKEN_FILES' ||
                e.type === 'DIRECTORY_NOT_ACCESSIBLE');
            if (criticalErrors.length > 0) {
                const errorMessages = criticalErrors.map(e => {
                    let msg = e.message;
                    if (e.suggestion)
                        msg += ` Suggestion: ${e.suggestion}`;
                    if (e.recoveryAction)
                        msg += ` Recovery: ${e.recoveryAction}`;
                    return msg;
                });
                throw new McpError(ErrorCode.InvalidRequest, `Cannot access design tokens: ${errorMessages.join('; ')}`);
            }
        }
        // Build category summaries with enhanced information
        const categoryDetails = result.parsedResult.categories.map(cat => {
            const categoryInfo = getCategoryInfo(cat.name);
            return {
                name: cat.name,
                displayName: categoryInfo.displayName,
                tokenCount: cat.totalCount,
                description: categoryInfo.description,
                icon: categoryInfo.icon,
            };
        });
        // Generate overall summary
        const summary = getCategorySummary(result.parsedResult.categories);
        // Prepare next steps based on what was found
        const nextSteps = [
            'Use get_category_tokens to explore tokens in a specific category',
            'Use get_token_reference to get detailed information about specific tokens',
        ];
        if (result.parsedResult.categories.length > 0) {
            const topCategories = result.parsedResult.categories
                .slice(0, 3)
                .map(cat => `get_category_tokens(category: "${cat.name}")`)
                .join(', ');
            nextSteps.unshift(`Try: ${topCategories}`);
        }
        return {
            success: true,
            summary,
            directory: result.directory,
            fileCount: result.files.length,
            categories: categoryDetails,
            totalTokens: result.parsedResult.allTokens.length,
            warnings: healthCheck.warnings,
            recommendations: healthCheck.recommendations,
            nextSteps,
        };
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        // Handle unexpected errors with helpful context
        const errorContext = directory ? `directory "${directory}"` : 'default token directory';
        throw new McpError(ErrorCode.InternalError, `Failed to discover design tokens in ${errorContext}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Helper function to get setup guidance based on discovery results
export function getSetupGuidance(result) {
    const guidance = [];
    if (result.totalTokens === 0) {
        guidance.push('🚀 Getting Started:');
        guidance.push('  1. Add W3C Design Token JSON files to your tokens directory');
        guidance.push('  2. Organize tokens by category (colors.json, typography.json, spacing.json)');
        guidance.push('  3. Use the examples/ directory as a reference for token structure');
    }
    else if (result.fileCount === 1) {
        guidance.push('💡 Organization Tip:');
        guidance.push('  Consider splitting tokens into separate files by category for better maintainability');
    }
    else if (result.categories.length > 10) {
        guidance.push('📦 Optimization Tip:');
        guidance.push('  Consider consolidating related token categories to simplify your design system');
    }
    if (result.warnings.length > 0) {
        guidance.push('⚠️  Warnings to address:');
        result.warnings.forEach(warning => guidance.push(`  • ${warning}`));
    }
    if (result.recommendations && result.recommendations.length > 0) {
        guidance.push('✨ Recommendations:');
        result.recommendations.forEach(rec => guidance.push(`  • ${rec}`));
    }
    return guidance;
}
// Validation helper for common discovery issues
export function validateDiscoveryRequest(args) {
    const issues = [];
    if (args.directory && typeof args.directory !== 'string') {
        issues.push('Directory parameter must be a string');
    }
    if (args.directory && args.directory.trim() === '') {
        issues.push('Directory parameter cannot be empty');
    }
    // Check for common path issues
    if (args.directory) {
        const dir = args.directory.trim();
        if (dir.includes('..')) {
            issues.push('Directory path should not contain ".." for security reasons');
        }
        if (dir.startsWith('~') && !dir.startsWith('~/')) {
            issues.push('Use "~/" for home directory paths');
        }
    }
    return issues;
}
// Format the discovery response for different output formats
export function formatDiscoveryResponse(result, format = 'json') {
    switch (format) {
        case 'summary':
            return `${result.summary}\n\nNext steps: ${result.nextSteps.join(', ')}`;
        case 'detailed':
            const lines = [
                `📁 Design System Overview`,
                `Directory: ${result.directory}`,
                `Files: ${result.fileCount}`,
                `Total Tokens: ${result.totalTokens}`,
                '',
                '📊 Categories:',
            ];
            result.categories.forEach(cat => {
                const icon = cat.icon || '•';
                lines.push(`  ${icon} ${cat.displayName}: ${cat.tokenCount} tokens`);
                lines.push(`     ${cat.description}`);
            });
            if (result.warnings.length > 0) {
                lines.push('', '⚠️  Warnings:');
                result.warnings.forEach(warning => lines.push(`  • ${warning}`));
            }
            lines.push('', '🎯 Next Steps:');
            result.nextSteps.forEach(step => lines.push(`  • ${step}`));
            const guidance = getSetupGuidance(result);
            if (guidance.length > 0) {
                lines.push('', ...guidance);
            }
            return lines.join('\n');
        case 'json':
        default:
            return JSON.stringify(result, null, 2);
    }
}
