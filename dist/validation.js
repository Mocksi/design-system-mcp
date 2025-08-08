import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
/**
 * Centralized validation and error handling for MCP tools
 *
 * Provides consistent validation, error formatting, and user-friendly
 * error messages across all three layers of the MCP server.
 */
export var ValidationErrorType;
(function (ValidationErrorType) {
    ValidationErrorType["INVALID_PARAMETER"] = "INVALID_PARAMETER";
    ValidationErrorType["MISSING_REQUIRED"] = "MISSING_REQUIRED";
    ValidationErrorType["INVALID_FORMAT"] = "INVALID_FORMAT";
    ValidationErrorType["SECURITY_VIOLATION"] = "SECURITY_VIOLATION";
    ValidationErrorType["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ValidationErrorType["SYSTEM_ERROR"] = "SYSTEM_ERROR";
})(ValidationErrorType || (ValidationErrorType = {}));
export class MCPValidationError extends McpError {
    issues;
    constructor(issues) {
        const message = formatValidationErrorMessage(issues);
        super(ErrorCode.InvalidRequest, message);
        this.issues = issues;
        this.name = 'MCPValidationError';
    }
}
// Schema definitions for consistent parameter validation
export const DirectoryParameterSchema = z.string()
    .min(1, 'Directory path cannot be empty')
    .refine(path => !path.includes('..'), 'Directory path cannot contain ".." for security reasons')
    .refine(path => path.startsWith('./') || path.startsWith('/') || path.startsWith('~/'), 'Directory path should be absolute or relative (start with ./, /, or ~/)')
    .optional();
export const CategoryParameterSchema = z.string()
    .min(1, 'Category name is required')
    .regex(/^[a-z0-9\-_]+$/i, 'Category name should only contain letters, numbers, hyphens, and underscores')
    .transform(val => val.toLowerCase());
export const TokenNameParameterSchema = z.string()
    .min(1, 'Token name is required')
    .max(200, 'Token name is too long (maximum 200 characters)');
export const BooleanParameterSchema = z.boolean().optional();
// Layer-specific validation schemas
export const Layer1ValidationSchema = z.object({
    directory: DirectoryParameterSchema,
});
export const Layer2ValidationSchema = z.object({
    category: CategoryParameterSchema,
    directory: DirectoryParameterSchema,
    includeResolved: BooleanParameterSchema,
});
export const Layer3ValidationSchema = z.object({
    category: CategoryParameterSchema,
    name: TokenNameParameterSchema,
    directory: DirectoryParameterSchema,
    includeExamples: BooleanParameterSchema,
    includeRelated: BooleanParameterSchema,
});
// Validation functions for each layer
export function validateLayer1Args(args) {
    try {
        return Layer1ValidationSchema.parse(args);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new MCPValidationError(convertZodErrorToValidationIssues(error));
        }
        throw error;
    }
}
export function validateLayer2Args(args) {
    try {
        return Layer2ValidationSchema.parse(args);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issues = convertZodErrorToValidationIssues(error);
            // Add category-specific suggestions
            const categoryIssue = issues.find(issue => issue.field === 'category');
            if (categoryIssue) {
                categoryIssue.allowedValues = [
                    'colors', 'typography', 'spacing', 'borders',
                    'shadows', 'animations', 'components'
                ];
                categoryIssue.suggestion = 'Use get_design_system_info first to see available categories';
            }
            throw new MCPValidationError(issues);
        }
        throw error;
    }
}
export function validateLayer3Args(args) {
    try {
        return Layer3ValidationSchema.parse(args);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issues = convertZodErrorToValidationIssues(error);
            // Add context-specific suggestions
            const categoryIssue = issues.find(issue => issue.field === 'category');
            if (categoryIssue) {
                categoryIssue.suggestion = 'Use get_design_system_info to see available categories';
            }
            const nameIssue = issues.find(issue => issue.field === 'name');
            if (nameIssue) {
                nameIssue.suggestion = 'Use get_category_tokens to see available token names in the category';
            }
            throw new MCPValidationError(issues);
        }
        throw error;
    }
}
function convertZodErrorToValidationIssues(error) {
    return error.issues.map(issue => {
        const field = issue.path.join('.');
        let type = ValidationErrorType.INVALID_PARAMETER;
        let suggestion;
        // Determine error type based on Zod issue
        switch (issue.code) {
            case 'invalid_type':
                if (issue.received === 'undefined') {
                    type = ValidationErrorType.MISSING_REQUIRED;
                }
                break;
            case 'too_small':
                type = ValidationErrorType.INVALID_FORMAT;
                suggestion = 'Provide a non-empty value';
                break;
            case 'too_big':
                type = ValidationErrorType.INVALID_FORMAT;
                suggestion = 'Use a shorter value';
                break;
            case 'invalid_string':
                type = ValidationErrorType.INVALID_FORMAT;
                if (issue.validation === 'regex') {
                    suggestion = 'Use only letters, numbers, hyphens, and underscores';
                }
                break;
            case 'custom':
                if (issue.message.includes('security')) {
                    type = ValidationErrorType.SECURITY_VIOLATION;
                }
                else {
                    type = ValidationErrorType.INVALID_FORMAT;
                }
                break;
        }
        return {
            type,
            field: field || undefined,
            message: issue.message,
            suggestion,
        };
    });
}
// Error formatting functions
function formatValidationErrorMessage(issues) {
    const header = `Validation failed with ${issues.length} error${issues.length > 1 ? 's' : ''}:`;
    const formattedIssues = issues.map(issue => {
        let message = `  • ${issue.field ? `${issue.field}: ` : ''}${issue.message}`;
        if (issue.suggestion) {
            message += `\n    💡 ${issue.suggestion}`;
        }
        if (issue.allowedValues && issue.allowedValues.length > 0) {
            message += `\n    🎯 Allowed values: ${issue.allowedValues.join(', ')}`;
        }
        return message;
    }).join('\n');
    return `${header}\n${formattedIssues}`;
}
// Common validation utilities
export function validateCategoryExists(category, availableCategories) {
    if (!availableCategories.includes(category)) {
        throw new MCPValidationError([{
                type: ValidationErrorType.RESOURCE_NOT_FOUND,
                field: 'category',
                message: `Category "${category}" not found`,
                suggestion: 'Use get_design_system_info to see available categories',
                allowedValues: availableCategories,
            }]);
    }
}
export function validateTokenExists(tokenName, category, availableTokens) {
    if (!availableTokens.includes(tokenName)) {
        const suggestions = findSimilarTokens(tokenName, availableTokens);
        throw new MCPValidationError([{
                type: ValidationErrorType.RESOURCE_NOT_FOUND,
                field: 'name',
                message: `Token "${tokenName}" not found in category "${category}"`,
                suggestion: suggestions.length > 0
                    ? `Did you mean: ${suggestions.join(', ')}? Use get_category_tokens to see all available tokens.`
                    : `Use get_category_tokens(category: "${category}") to see available tokens`,
                allowedValues: availableTokens.slice(0, 10), // Limit to first 10 for readability
            }]);
    }
}
function findSimilarTokens(input, availableTokens) {
    const inputLower = input.toLowerCase();
    const similar = [];
    for (const token of availableTokens) {
        const tokenLower = token.toLowerCase();
        // Exact substring match
        if (tokenLower.includes(inputLower) || inputLower.includes(tokenLower)) {
            similar.push({ token, score: 10 });
        }
        // Similar word parts
        else if (inputLower.split('-').some(part => tokenLower.includes(part))) {
            similar.push({ token, score: 5 });
        }
        // Levenshtein distance for close matches
        else if (levenshteinDistance(inputLower, tokenLower) <= 3) {
            similar.push({ token, score: 3 });
        }
    }
    return similar
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.token);
}
function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + substitutionCost);
        }
    }
    return matrix[str2.length][str1.length];
}
// Error recovery suggestions
export function generateErrorRecoverySteps(toolName, issues) {
    const steps = [];
    // Tool-specific recovery steps
    switch (toolName) {
        case 'get_design_system_info':
            steps.push('This is the discovery tool - it should work without parameters');
            if (issues.some(i => i.field === 'directory')) {
                steps.push('Try without the directory parameter to use the default location');
                steps.push('Check that DESIGN_TOKENS_PATH environment variable is set correctly');
            }
            break;
        case 'get_category_tokens':
            steps.push('First use get_design_system_info to see available categories');
            if (issues.some(i => i.field === 'category')) {
                steps.push('Use one of the category names from get_design_system_info results');
                steps.push('Category names should be lowercase (e.g., "colors", not "Colors")');
            }
            break;
        case 'get_token_reference':
            steps.push('First use get_category_tokens to find the exact token name');
            if (issues.some(i => i.field === 'category')) {
                steps.push('Use get_design_system_info to see available categories');
            }
            if (issues.some(i => i.field === 'name')) {
                steps.push('Copy the exact token name from get_category_tokens results');
                steps.push('Token names are case-sensitive and include the full path');
            }
            break;
    }
    // General recovery steps
    steps.push('Check the tool description for parameter requirements');
    steps.push('Follow the progressive flow: discovery → understanding → reference');
    return steps;
}
// Comprehensive error wrapper for tool functions
export function wrapToolExecution(toolName, toolFunction, validationFunction) {
    return async (...args) => {
        try {
            // Validation if provided
            if (validationFunction && args.length > 0) {
                validationFunction(args[0]);
            }
            // Execute tool
            return await toolFunction(...args);
        }
        catch (error) {
            // Handle different error types
            if (error instanceof MCPValidationError) {
                // Add recovery steps to validation errors
                const recoverySteps = generateErrorRecoverySteps(toolName, error.issues);
                const enhancedMessage = error.message + '\n\n🔧 Recovery steps:\n' +
                    recoverySteps.map(step => `  • ${step}`).join('\n');
                throw new McpError(ErrorCode.InvalidRequest, enhancedMessage);
            }
            if (error instanceof McpError) {
                throw error;
            }
            // Handle unexpected errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new McpError(ErrorCode.InternalError, `${toolName} execution failed: ${errorMessage}`);
        }
    };
}
// Tool-specific validation helpers
export function validateDesignSystemSetup(directoryPath) {
    // This would integrate with the FileErrorHandler from discovery.ts
    // to provide comprehensive setup validation
}
export function sanitizeUserInput(input, maxLength = 1000) {
    return input
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, '') // Remove potential HTML injection
        .replace(/\0/g, ''); // Remove null bytes
}
export function createValidationResult(data, issues = []) {
    return {
        isValid: issues.length === 0,
        data,
        issues: issues.length > 0 ? issues : undefined,
    };
}
