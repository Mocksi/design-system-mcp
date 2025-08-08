import { z } from 'zod';
/**
 * Layer 2: Understanding Tool
 *
 * Provides category-specific token exploration:
 * - Returns all tokens within a specified category
 * - Includes token values, types, and basic metadata
 * - Resolves token references and aliases
 * - Groups tokens by subcategories when applicable
 */
export interface CategoryTokensArgs {
    category: string;
    directory?: string;
    includeResolved?: boolean;
}
export interface TokenSummary {
    name: string;
    path: string[];
    value: any;
    resolvedValue?: any;
    type?: string;
    description?: string;
    cssVariable: string;
    usage: string;
    subcategory?: string;
}
export interface CategoryTokensResult {
    success: boolean;
    category: {
        name: string;
        displayName: string;
        description: string;
        icon?: string;
        tokenCount: number;
    };
    tokens: TokenSummary[];
    subcategories?: {
        [key: string]: TokenSummary[];
    };
    statistics: {
        totalTokens: number;
        tokensByType: {
            [key: string]: number;
        };
        resolvedTokens?: number;
        unresolvedReferences?: number;
    };
    nextSteps: string[];
}
export declare const CategoryTokensArgsSchema: z.ZodObject<{
    category: z.ZodString;
    directory: z.ZodOptional<z.ZodString>;
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
export declare function getCategoryTokens(args: CategoryTokensArgs): Promise<CategoryTokensResult>;
export declare function filterTokens(tokens: TokenSummary[], filters: {
    type?: string;
    subcategory?: string;
    hasDescription?: boolean;
    nameContains?: string;
}): TokenSummary[];
export declare function sortTokens(tokens: TokenSummary[], sortBy?: 'name' | 'type' | 'subcategory' | 'path'): TokenSummary[];
export declare function validateCategoryName(category: string): string[];
export declare function formatCategoryResponse(result: CategoryTokensResult, format?: 'json' | 'table' | 'list'): string;
