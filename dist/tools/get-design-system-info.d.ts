import { z } from 'zod';
/**
 * Layer 1: Discovery Tool
 *
 * Provides system-wide overview of design tokens:
 * - Discovers available token categories
 * - Returns category summaries with token counts
 * - Shows file and directory information
 * - Performs health checks and validation
 */
export interface DesignSystemInfoArgs {
    directory?: string;
}
export interface CategorySummary {
    name: string;
    displayName: string;
    tokenCount: number;
    description: string;
    icon?: string;
}
export interface DesignSystemInfoResult {
    success: boolean;
    summary: string;
    directory: string;
    fileCount: number;
    categories: CategorySummary[];
    totalTokens: number;
    warnings: string[];
    recommendations?: string[];
    nextSteps: string[];
}
export declare const DesignSystemInfoArgsSchema: z.ZodObject<{
    directory: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    directory?: string | undefined;
}, {
    directory?: string | undefined;
}>;
export declare function getDesignSystemInfo(args: DesignSystemInfoArgs): Promise<DesignSystemInfoResult>;
export declare function getSetupGuidance(result: DesignSystemInfoResult): string[];
export declare function validateDiscoveryRequest(args: any): string[];
export declare function formatDiscoveryResponse(result: DesignSystemInfoResult, format?: 'json' | 'summary' | 'detailed'): string;
