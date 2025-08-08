import { z } from 'zod';
/**
 * Layer 3: Reference Tool
 *
 * Provides detailed token-specific information:
 * - Complete token metadata and resolved values
 * - Usage examples and CSS integration code
 * - Related token suggestions
 * - Format variations (CSS vars, Sass, etc.)
 */
export interface TokenReferenceArgs {
    category: string;
    name: string;
    directory?: string;
    includeExamples?: boolean;
    includeRelated?: boolean;
}
export interface TokenReference {
    name: string;
    path: string[];
    category: string;
    value: any;
    resolvedValue?: any;
    type?: string;
    description?: string;
    cssVariable: string;
    cssClass: string;
    sassVariable: string;
    lessVariable: string;
    jsConstant: string;
    usage: string;
    examples: CodeExample[];
    platforms: PlatformUsage[];
    relatedTokens: RelatedToken[];
    tokenHierarchy?: TokenHierarchy;
    isResolved: boolean;
    referencePath?: string;
    resolutionError?: string;
}
export interface CodeExample {
    language: string;
    framework?: string;
    code: string;
    description: string;
}
export interface PlatformUsage {
    platform: string;
    format: string;
    example: string;
}
export interface RelatedToken {
    name: string;
    relationship: 'variant' | 'parent' | 'child' | 'sibling' | 'semantic';
    description?: string;
}
export interface TokenHierarchy {
    parent?: string;
    children: string[];
    variants: string[];
}
export interface TokenReferenceResult {
    success: boolean;
    token: TokenReference;
    recommendations: string[];
    nextSteps: string[];
}
export declare const TokenReferenceArgsSchema: z.ZodObject<{
    category: z.ZodString;
    name: z.ZodString;
    directory: z.ZodOptional<z.ZodString>;
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
export declare function getTokenReference(args: TokenReferenceArgs): Promise<TokenReferenceResult>;
export declare function validateTokenReferenceRequest(args: any): string[];
