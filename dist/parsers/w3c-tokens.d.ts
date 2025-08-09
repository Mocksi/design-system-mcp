import { z } from 'zod';
declare const TokenTypeSchema: z.ZodEnum<["color", "dimension", "fontFamily", "fontWeight", "duration", "cubicBezier", "number", "strokeStyle", "border", "transition", "shadow", "gradient", "typography"]>;
declare const BaseTokenSchema: z.ZodObject<{
    $type: z.ZodOptional<z.ZodEnum<["color", "dimension", "fontFamily", "fontWeight", "duration", "cubicBezier", "number", "strokeStyle", "border", "transition", "shadow", "gradient", "typography"]>>;
    $value: z.ZodAny;
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    $type?: "number" | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "strokeStyle" | "border" | "transition" | "shadow" | "gradient" | "typography" | undefined;
    $value?: any;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type?: "number" | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "strokeStyle" | "border" | "transition" | "shadow" | "gradient" | "typography" | undefined;
    $value?: any;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const ColorTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"color">;
    $value: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    $type: "color";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "color";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const DimensionTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"dimension">;
    $value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    $type: "dimension";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "dimension";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const FontFamilyTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"fontFamily">;
    $value: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
}, "strip", z.ZodTypeAny, {
    $type: "fontFamily";
    $value: string | string[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "fontFamily";
    $value: string | string[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const FontWeightTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"fontWeight">;
    $value: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    $type: "fontWeight";
    $value: string | number;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "fontWeight";
    $value: string | number;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const TypographyTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"typography">;
    $value: z.ZodObject<{
        fontFamily: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        fontSize: z.ZodString;
        fontWeight: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        letterSpacing: z.ZodOptional<z.ZodString>;
        lineHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    }, "strip", z.ZodTypeAny, {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    }, {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    $type: "typography";
    $value: {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "typography";
    $value: {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const BorderTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"border">;
    $value: z.ZodObject<{
        color: z.ZodString;
        width: z.ZodString;
        style: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        color: string;
        width: string;
        style: string;
    }, {
        color: string;
        width: string;
        style: string;
    }>;
}, "strip", z.ZodTypeAny, {
    $type: "border";
    $value: {
        color: string;
        width: string;
        style: string;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "border";
    $value: {
        color: string;
        width: string;
        style: string;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const ShadowTokenSchema: z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"shadow">;
    $value: z.ZodUnion<[z.ZodObject<{
        color: z.ZodString;
        offsetX: z.ZodString;
        offsetY: z.ZodString;
        blur: z.ZodString;
        spread: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }>, z.ZodArray<z.ZodObject<{
        color: z.ZodString;
        offsetX: z.ZodString;
        offsetY: z.ZodString;
        blur: z.ZodString;
        spread: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }>, "many">]>;
}, "strip", z.ZodTypeAny, {
    $type: "shadow";
    $value: {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    } | {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "shadow";
    $value: {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    } | {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const TokenReferenceSchema: z.ZodObject<{
    $value: z.ZodString;
    $type: z.ZodOptional<z.ZodEnum<["color", "dimension", "fontFamily", "fontWeight", "duration", "cubicBezier", "number", "strokeStyle", "border", "transition", "shadow", "gradient", "typography"]>>;
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    $value: string;
    $type?: "number" | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "strokeStyle" | "border" | "transition" | "shadow" | "gradient" | "typography" | undefined;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $value: string;
    $type?: "number" | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "strokeStyle" | "border" | "transition" | "shadow" | "gradient" | "typography" | undefined;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>;
declare const TokenSchema: z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"color">;
    $value: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    $type: "color";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "color";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"dimension">;
    $value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    $type: "dimension";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "dimension";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"fontFamily">;
    $value: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
}, "strip", z.ZodTypeAny, {
    $type: "fontFamily";
    $value: string | string[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "fontFamily";
    $value: string | string[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"fontWeight">;
    $value: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    $type: "fontWeight";
    $value: string | number;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "fontWeight";
    $value: string | number;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"duration">;
    $value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    $type: "duration";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "duration";
    $value: string;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"number">;
    $value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    $type: "number";
    $value: number;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "number";
    $value: number;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"typography">;
    $value: z.ZodObject<{
        fontFamily: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        fontSize: z.ZodString;
        fontWeight: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        letterSpacing: z.ZodOptional<z.ZodString>;
        lineHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    }, "strip", z.ZodTypeAny, {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    }, {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    $type: "typography";
    $value: {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "typography";
    $value: {
        fontFamily: string | string[];
        fontWeight: string | number;
        fontSize: string;
        letterSpacing?: string | undefined;
        lineHeight?: string | number | undefined;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"border">;
    $value: z.ZodObject<{
        color: z.ZodString;
        width: z.ZodString;
        style: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        color: string;
        width: string;
        style: string;
    }, {
        color: string;
        width: string;
        style: string;
    }>;
}, "strip", z.ZodTypeAny, {
    $type: "border";
    $value: {
        color: string;
        width: string;
        style: string;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "border";
    $value: {
        color: string;
        width: string;
        style: string;
    };
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
} & {
    $type: z.ZodLiteral<"shadow">;
    $value: z.ZodUnion<[z.ZodObject<{
        color: z.ZodString;
        offsetX: z.ZodString;
        offsetY: z.ZodString;
        blur: z.ZodString;
        spread: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }>, z.ZodArray<z.ZodObject<{
        color: z.ZodString;
        offsetX: z.ZodString;
        offsetY: z.ZodString;
        blur: z.ZodString;
        spread: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }, {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }>, "many">]>;
}, "strip", z.ZodTypeAny, {
    $type: "shadow";
    $value: {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    } | {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $type: "shadow";
    $value: {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    } | {
        color: string;
        offsetX: string;
        offsetY: string;
        blur: string;
        spread?: string | undefined;
    }[];
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>]>, z.ZodObject<{
    $value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>]>;
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strict", z.ZodTypeAny, {
    $value: string | number | z.objectOutputType<{}, z.ZodTypeAny, "passthrough">;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $value: string | number | z.objectInputType<{}, z.ZodTypeAny, "passthrough">;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>, z.ZodObject<{
    $value: z.ZodString;
    $type: z.ZodOptional<z.ZodEnum<["color", "dimension", "fontFamily", "fontWeight", "duration", "cubicBezier", "number", "strokeStyle", "border", "transition", "shadow", "gradient", "typography"]>>;
    $description: z.ZodOptional<z.ZodString>;
    $extensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    $value: string;
    $type?: "number" | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "strokeStyle" | "border" | "transition" | "shadow" | "gradient" | "typography" | undefined;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}, {
    $value: string;
    $type?: "number" | "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "cubicBezier" | "strokeStyle" | "border" | "transition" | "shadow" | "gradient" | "typography" | undefined;
    $description?: string | undefined;
    $extensions?: Record<string, any> | undefined;
}>]>;
declare const TokenGroupSchema: z.ZodType<any>;
export declare const DesignTokensFileSchema: z.ZodEffects<z.ZodType<any, z.ZodTypeDef, any>, any, any>;
export type TokenType = z.infer<typeof TokenTypeSchema>;
export type BaseToken = z.infer<typeof BaseTokenSchema>;
export type ColorToken = z.infer<typeof ColorTokenSchema>;
export type DimensionToken = z.infer<typeof DimensionTokenSchema>;
export type FontFamilyToken = z.infer<typeof FontFamilyTokenSchema>;
export type FontWeightToken = z.infer<typeof FontWeightTokenSchema>;
export type TypographyToken = z.infer<typeof TypographyTokenSchema>;
export type BorderToken = z.infer<typeof BorderTokenSchema>;
export type ShadowToken = z.infer<typeof ShadowTokenSchema>;
export type TokenReference = z.infer<typeof TokenReferenceSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type TokenGroup = z.infer<typeof TokenGroupSchema>;
export type DesignTokensFile = z.infer<typeof DesignTokensFileSchema>;
export declare function validateDesignTokensFile(data: unknown): DesignTokensFile;
export declare function isToken(value: unknown): value is Token;
export declare function isTokenGroup(value: unknown): value is TokenGroup;
export declare function isTokenReference(value: unknown): value is TokenReference;
export interface ParsedToken {
    name: string;
    path: string[];
    value: any;
    type?: TokenType;
    description?: string;
    extensions?: Record<string, any>;
}
export interface TokenCategory {
    name: string;
    tokens: ParsedToken[];
    totalCount: number;
}
export interface ParsedTokensResult {
    categories: TokenCategory[];
    allTokens: ParsedToken[];
    fileCount: number;
    errors: string[];
}
export declare class TokenFileParser {
    private tokens;
    private categories;
    private errors;
    parseTokenFile(filePath: string): void;
    private extractTokensFromGroup;
    getResults(): ParsedTokensResult;
    clear(): void;
    hasErrors(): boolean;
    getToken(name: string): ParsedToken | undefined;
    getTokensByCategory(category: string): ParsedToken[];
    getAllCategories(): string[];
}
export interface CategoryInfo {
    name: string;
    displayName: string;
    description: string;
    expectedTypes: TokenType[];
    icon?: string;
}
export declare const KNOWN_CATEGORIES: Record<string, CategoryInfo>;
export declare function categorizeTokens(tokens: ParsedToken[]): TokenCategory[];
export declare function inferTokenCategory(token: ParsedToken): string;
export declare function getCategoryInfo(categoryName: string): CategoryInfo;
export declare function getCategorySummary(categories: TokenCategory[]): string;
export declare function parseMultipleTokenFiles(filePaths: string[]): ParsedTokensResult;
export interface ResolvedToken extends ParsedToken {
    originalValue?: any;
    resolvedValue: any;
    referencePath?: string;
    isResolved: boolean;
    hasCircularReference?: boolean;
    resolutionError?: string;
}
export declare class TokenReferenceResolver {
    private tokenMap;
    private resolvedTokens;
    private resolutionStack;
    constructor(tokens: ParsedToken[]);
    resolveAllTokens(): ResolvedToken[];
    resolveToken(tokenName: string): ResolvedToken | null;
    private resolveTokenValue;
    private resolveCompositeValue;
    private isTokenReference;
    private parseTokenReference;
    private findReferencedToken;
}
export declare function resolveTokenReferences(tokens: ParsedToken[]): ResolvedToken[];
export declare function getUnresolvedTokens(resolvedTokens: ResolvedToken[]): ResolvedToken[];
export declare function getCircularReferences(resolvedTokens: ResolvedToken[]): ResolvedToken[];
export declare enum TokenErrorType {
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    INVALID_JSON = "INVALID_JSON",
    SCHEMA_VALIDATION = "SCHEMA_VALIDATION",
    MISSING_VALUE = "MISSING_VALUE",
    MISSING_TYPE = "MISSING_TYPE",
    INVALID_TYPE = "INVALID_TYPE",
    INVALID_REFERENCE = "INVALID_REFERENCE",
    CIRCULAR_REFERENCE = "CIRCULAR_REFERENCE",
    UNRESOLVED_REFERENCE = "UNRESOLVED_REFERENCE",
    COMPOSITE_TOKEN_ERROR = "COMPOSITE_TOKEN_ERROR"
}
export interface TokenError {
    type: TokenErrorType;
    message: string;
    file?: string;
    tokenPath?: string[];
    tokenName?: string;
    line?: number;
    column?: number;
    suggestion?: string;
}
export declare class TokenValidationError extends Error {
    errors: TokenError[];
    constructor(errors: TokenError[]);
}
export declare class TokenFileValidator {
    private errors;
    validateTokenFile(filePath: string, content?: string): TokenError[];
    private addError;
    private parseZodValidationError;
    private categorizeValidationError;
    private validateTokenSemantics;
    private validateToken;
    private validateTokenReference;
    private validateCompositeTokenValue;
    private validateTypographyToken;
    private validateBorderToken;
    private validateShadowToken;
}
export declare function formatTokenError(error: TokenError): string;
export declare function formatTokenErrors(errors: TokenError[]): string;
export declare function validateTokenFiles(filePaths: string[]): TokenError[];
export declare function hasValidationErrors(result: ParsedTokensResult): boolean;
export declare function getValidationSummary(errors: TokenError[]): string;
export {};
