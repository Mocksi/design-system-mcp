import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
/**
 * Centralized validation and error handling for MCP tools
 *
 * Provides consistent validation, error formatting, and user-friendly
 * error messages across all three layers of the MCP server.
 */
export declare enum ValidationErrorType {
    INVALID_PARAMETER = "INVALID_PARAMETER",
    MISSING_REQUIRED = "MISSING_REQUIRED",
    INVALID_FORMAT = "INVALID_FORMAT",
    SECURITY_VIOLATION = "SECURITY_VIOLATION",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    SYSTEM_ERROR = "SYSTEM_ERROR"
}
export interface ValidationIssue {
    type: ValidationErrorType;
    field?: string;
    message: string;
    suggestion?: string;
    allowedValues?: string[];
}
export declare class MCPValidationError extends McpError {
    issues: ValidationIssue[];
    constructor(issues: ValidationIssue[]);
}
export declare const DirectoryParameterSchema: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
export declare const CategoryParameterSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const TokenNameParameterSchema: z.ZodString;
export declare const BooleanParameterSchema: z.ZodOptional<z.ZodBoolean>;
export declare const Layer1ValidationSchema: z.ZodObject<{
    directory: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
}, "strip", z.ZodTypeAny, {
    directory?: string | undefined;
}, {
    directory?: string | undefined;
}>;
export declare const Layer2ValidationSchema: z.ZodObject<{
    category: z.ZodEffects<z.ZodString, string, string>;
    directory: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    includeResolved: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    category: string;
    directory?: string | undefined;
    includeResolved?: boolean | undefined;
}, {
    category: string;
    directory?: string | undefined;
    includeResolved?: boolean | undefined;
}>;
export declare const Layer3ValidationSchema: z.ZodObject<{
    category: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodString;
    directory: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
    includeRelated: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: string;
    directory?: string | undefined;
    includeExamples?: boolean | undefined;
    includeRelated?: boolean | undefined;
}, {
    name: string;
    category: string;
    directory?: string | undefined;
    includeExamples?: boolean | undefined;
    includeRelated?: boolean | undefined;
}>;
export declare function validateLayer1Args(args: unknown): {
    directory?: string;
};
export declare function validateLayer2Args(args: unknown): {
    category: string;
    directory?: string;
    includeResolved?: boolean;
};
export declare function validateLayer3Args(args: unknown): {
    category: string;
    name: string;
    directory?: string;
    includeExamples?: boolean;
    includeRelated?: boolean;
};
export declare function validateCategoryExists(category: string, availableCategories: string[]): void;
export declare function validateTokenExists(tokenName: string, category: string, availableTokens: string[]): void;
export declare function generateErrorRecoverySteps(toolName: string, issues: ValidationIssue[]): string[];
export declare function wrapToolExecution<T extends any[], R>(toolName: string, toolFunction: (...args: T) => Promise<R>, validationFunction?: (args: any) => any): (...args: T) => Promise<R>;
export declare function validateDesignSystemSetup(directoryPath?: string): void;
export declare function sanitizeUserInput(input: string, maxLength?: number): string;
export interface ValidationResult<T> {
    isValid: boolean;
    data?: T;
    issues?: ValidationIssue[];
}
export declare function createValidationResult<T>(data: T, issues?: ValidationIssue[]): ValidationResult<T>;
