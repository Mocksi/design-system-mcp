import { z } from 'zod';
// W3C Design Token specification types
const TokenTypeSchema = z.enum([
    'color',
    'dimension',
    'fontFamily',
    'fontWeight',
    'duration',
    'cubicBezier',
    'number',
    'strokeStyle',
    'border',
    'transition',
    'shadow',
    'gradient',
    'typography',
]);
// Base token schema
const BaseTokenSchema = z.object({
    $type: TokenTypeSchema.optional(),
    $value: z.any(),
    $description: z.string().optional(),
    $extensions: z.record(z.any()).optional(),
});
// Color token
const ColorTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('color'),
    $value: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
});
// Dimension token
const DimensionTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('dimension'),
    $value: z.string(),
});
// Font family token
const FontFamilyTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('fontFamily'),
    $value: z.union([z.string(), z.array(z.string())]),
});
// Font weight token
const FontWeightTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('fontWeight'),
    $value: z.union([z.number(), z.string()]),
});
// Duration token
const DurationTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('duration'),
    $value: z.string(),
});
// Number token
const NumberTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('number'),
    $value: z.number(),
});
// Typography composite token
const TypographyTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('typography'),
    $value: z.object({
        fontFamily: z.union([z.string(), z.array(z.string())]),
        fontSize: z.string(),
        fontWeight: z.union([z.number(), z.string()]),
        letterSpacing: z.string().optional(),
        lineHeight: z.union([z.number(), z.string()]).optional(),
    }),
});
// Border composite token
const BorderTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('border'),
    $value: z.object({
        color: z.string(),
        width: z.string(),
        style: z.string(),
    }),
});
// Shadow composite token
const ShadowTokenSchema = BaseTokenSchema.extend({
    $type: z.literal('shadow'),
    $value: z.union([
        z.object({
            color: z.string(),
            offsetX: z.string(),
            offsetY: z.string(),
            blur: z.string(),
            spread: z.string().optional(),
        }),
        z.array(z.object({
            color: z.string(),
            offsetX: z.string(),
            offsetY: z.string(),
            blur: z.string(),
            spread: z.string().optional(),
        })),
    ]),
});
// Union of all specific token types
const SpecificTokenSchema = z.union([
    ColorTokenSchema,
    DimensionTokenSchema,
    FontFamilyTokenSchema,
    FontWeightTokenSchema,
    DurationTokenSchema,
    NumberTokenSchema,
    TypographyTokenSchema,
    BorderTokenSchema,
    ShadowTokenSchema,
]);
// Untyped token (tokens without explicit $type)
const UntypedTokenSchema = z.object({
    $value: z.union([z.string(), z.number(), z.object({}).passthrough()]),
    $description: z.string().optional(),
    $extensions: z.record(z.any()).optional(),
}).strict();
// Token reference schema (for alias tokens)
const TokenReferenceSchema = z.object({
    $value: z.string().regex(/^\{[^}]+\}$/),
    $type: TokenTypeSchema.optional(),
    $description: z.string().optional(),
    $extensions: z.record(z.any()).optional(),
});
// Combined token schema
const TokenSchema = z.union([
    SpecificTokenSchema, // requires valid $type and matching $value
    UntypedTokenSchema, // no $type present
    TokenReferenceSchema, // reference string value
]);
// Token group schema (recursive for nested groups), allowing metadata keys
const TokenGroupSchema = z.lazy(() => z
    .object({
    $schema: z.string().optional(),
    $type: TokenTypeSchema.optional(),
    $description: z.string().optional(),
    $extensions: z.record(z.any()).optional(),
})
    .catchall(z.union([
    TokenSchema, // leaf tokens (including references)
    TokenGroupSchema, // nested groups
])));
// Root design tokens file schema
export const DesignTokensFileSchema = TokenGroupSchema.superRefine((obj, ctx) => {
    // For each property that isn't a $-metadata key, ensure it is either a valid TokenSchema
    // or a nested group that recursively contains tokens. If an object has $type or $value
    // but doesn't match TokenSchema, emit a validation issue.
    const validateNode = (node, path) => {
        if (node && typeof node === 'object' && !Array.isArray(node)) {
            const keys = Object.keys(node);
            const nonMeta = keys.filter(k => !k.startsWith('$'));
            // Looks like a token candidate if it has $type or $value
            const looksLikeToken = ('$type' in node) || ('$value' in node);
            const tokenCheck = TokenSchema.safeParse(node);
            if (looksLikeToken && !tokenCheck.success) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid token structure',
                    path,
                });
                return false;
            }
            // Recurse into children
            let foundValid = looksLikeToken && tokenCheck.success;
            for (const key of nonMeta) {
                const child = node[key];
                const ok = validateNode(child, [...path, key]);
                foundValid = foundValid || ok;
            }
            return foundValid;
        }
        return false;
    };
    validateNode(obj, []);
});
// Validation functions
export function validateDesignTokensFile(data) {
    try {
        return DesignTokensFileSchema.parse(data);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
            }));
            throw new Error(`Invalid W3C Design Token file:\n${issues
                .map(issue => `  ${issue.path}: ${issue.message}`)
                .join('\n')}`);
        }
        throw error;
    }
}
export function isToken(value) {
    return TokenSchema.safeParse(value).success;
}
export function isTokenGroup(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    // Check if it's a token first
    if (isToken(value))
        return false;
    // Check if all properties are either tokens or token groups
    for (const [key, val] of Object.entries(value)) {
        if (key.startsWith('$'))
            continue; // Skip metadata properties
        if (!isToken(val) && !isTokenGroup(val))
            return false;
    }
    return true;
}
export function isTokenReference(value) {
    return TokenReferenceSchema.safeParse(value).success;
}
// Narrowing helper for tokens that include a $type field
function tokenHasType(token) {
    return token != null && typeof token.$type === 'string';
}
// Token file parsing and merging functionality
import { readFileSync } from 'fs';
export class TokenFileParser {
    tokens = new Map();
    categories = new Map();
    errors = [];
    parseTokenFile(filePath) {
        try {
            const content = readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            // Validate the file against W3C schema
            const validatedData = validateDesignTokensFile(data);
            // Extract tokens from the validated data
            this.extractTokensFromGroup(validatedData, [], filePath);
        }
        catch (error) {
            const fileName = filePath.split('/').pop() || filePath;
            if (error instanceof SyntaxError) {
                this.errors.push(`${fileName}: Invalid JSON format - ${error.message}`);
            }
            else if (error instanceof Error) {
                this.errors.push(`${fileName}: ${error.message}`);
            }
            else {
                this.errors.push(`${fileName}: Unknown parsing error`);
            }
        }
    }
    extractTokensFromGroup(group, path, sourceFile) {
        for (const [key, value] of Object.entries(group)) {
            // Skip metadata properties
            if (key.startsWith('$'))
                continue;
            const currentPath = [...path, key];
            if (isToken(value)) {
                const tokenName = currentPath.join('-');
                const tokenType = tokenHasType(value) ? value.$type : undefined;
                const parsedToken = {
                    name: tokenName,
                    path: currentPath,
                    value: value.$value,
                    type: tokenType,
                    description: value.$description,
                    extensions: value.$extensions,
                };
                this.tokens.set(tokenName, parsedToken);
                // Categorize token based on first path segment
                const category = currentPath[0];
                if (!this.categories.has(category)) {
                    this.categories.set(category, []);
                }
                this.categories.get(category).push(parsedToken);
            }
            else if (isTokenGroup(value)) {
                // Recursively process nested groups
                this.extractTokensFromGroup(value, currentPath, sourceFile);
            }
        }
    }
    getResults() {
        const categories = Array.from(this.categories.entries())
            .map(([name, tokens]) => ({
            name,
            tokens,
            totalCount: tokens.length,
        }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return {
            categories,
            allTokens: Array.from(this.tokens.values()).sort((a, b) => a.name.localeCompare(b.name)),
            fileCount: 0, // Will be set by the caller
            errors: [...this.errors],
        };
    }
    clear() {
        this.tokens.clear();
        this.categories.clear();
        this.errors = [];
    }
    hasErrors() {
        return this.errors.length > 0;
    }
    getToken(name) {
        return this.tokens.get(name);
    }
    getTokensByCategory(category) {
        return this.categories.get(category) || [];
    }
    getAllCategories() {
        return Array.from(this.categories.keys()).sort();
    }
}
export const KNOWN_CATEGORIES = {
    colors: {
        name: 'colors',
        displayName: 'Colors',
        description: 'color tokens including primitives, semantic colors, and themed variations',
        expectedTypes: ['color'],
        icon: '🎨',
    },
    typography: {
        name: 'typography',
        displayName: 'Typography',
        description: 'typography tokens including font families, weights, sizes, and composite typography tokens',
        expectedTypes: ['fontFamily', 'fontWeight', 'dimension', 'typography'],
        icon: '📝',
    },
    spacing: {
        name: 'spacing',
        displayName: 'Spacing',
        description: 'Spacing and sizing tokens for margins, padding, and layout',
        expectedTypes: ['dimension'],
        icon: '📏',
    },
    borders: {
        name: 'borders',
        displayName: 'Borders',
        description: 'Border styles, widths, and composite border tokens',
        expectedTypes: ['border', 'dimension', 'strokeStyle'],
        icon: '⬜',
    },
    shadows: {
        name: 'shadows',
        displayName: 'Shadows',
        description: 'Box shadow and elevation tokens',
        expectedTypes: ['shadow'],
        icon: '🌑',
    },
    animations: {
        name: 'animations',
        displayName: 'Animations',
        description: 'Duration, easing, and transition tokens',
        expectedTypes: ['duration', 'cubicBezier', 'transition'],
        icon: '🎬',
    },
    components: {
        name: 'components',
        displayName: 'Components',
        description: 'Component-specific token collections',
        expectedTypes: ['color', 'dimension', 'border', 'shadow', 'typography'],
        icon: '🧩',
    },
};
export function categorizeTokens(tokens) {
    const categoryMap = new Map();
    for (const token of tokens) {
        const categoryName = inferTokenCategory(token);
        if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, []);
        }
        categoryMap.get(categoryName).push(token);
    }
    // Convert to array and sort
    const categories = [];
    // Add known categories first (in preferred order)
    const knownCategoryOrder = ['colors', 'typography', 'spacing', 'borders', 'shadows', 'animations', 'components'];
    for (const categoryName of knownCategoryOrder) {
        const tokens = categoryMap.get(categoryName);
        if (tokens && tokens.length > 0) {
            categories.push({
                name: categoryName,
                tokens: tokens.sort((a, b) => a.name.localeCompare(b.name)),
                totalCount: tokens.length,
            });
            categoryMap.delete(categoryName);
        }
    }
    // Add remaining categories alphabetically
    const remainingCategories = Array.from(categoryMap.keys()).sort();
    for (const categoryName of remainingCategories) {
        const tokens = categoryMap.get(categoryName);
        categories.push({
            name: categoryName,
            tokens: tokens.sort((a, b) => a.name.localeCompare(b.name)),
            totalCount: tokens.length,
        });
    }
    return categories;
}
export function inferTokenCategory(token) {
    // Use the first path segment as the primary category
    const primaryCategory = token.path[0].toLowerCase();
    // Check if it's a known category
    if (KNOWN_CATEGORIES[primaryCategory]) {
        return primaryCategory;
    }
    // Try to infer from token type
    if (token.type) {
        switch (token.type) {
            case 'color':
                return 'colors';
            case 'fontFamily':
            case 'fontWeight':
            case 'typography':
                return 'typography';
            case 'dimension':
                // Try to infer from name/path
                if (isSpacingToken(token))
                    return 'spacing';
                if (isBorderToken(token))
                    return 'borders';
                return 'dimensions';
            case 'border':
                return 'borders';
            case 'shadow':
                return 'shadows';
            case 'duration':
            case 'cubicBezier':
            case 'transition':
                return 'animations';
            default:
                return primaryCategory;
        }
    }
    // Fallback to primary category from path
    return primaryCategory;
}
function isSpacingToken(token) {
    const spacingKeywords = [
        'spacing', 'space', 'margin', 'padding', 'gap', 'inset',
        'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl',
        'none', 'auto', 'px'
    ];
    const tokenPath = token.path.join('-').toLowerCase();
    const tokenName = token.name.toLowerCase();
    return spacingKeywords.some(keyword => tokenPath.includes(keyword) || tokenName.includes(keyword));
}
function isBorderToken(token) {
    const borderKeywords = [
        'border', 'stroke', 'outline', 'divider',
        'width', 'radius', 'style'
    ];
    const tokenPath = token.path.join('-').toLowerCase();
    const tokenName = token.name.toLowerCase();
    return borderKeywords.some(keyword => tokenPath.includes(keyword) || tokenName.includes(keyword));
}
export function getCategoryInfo(categoryName) {
    return KNOWN_CATEGORIES[categoryName] || {
        name: categoryName,
        displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
        description: `${categoryName} tokens`,
        expectedTypes: [],
    };
}
export function getCategorySummary(categories) {
    if (categories.length === 0) {
        return 'No token categories found';
    }
    const summary = categories.map(cat => {
        const info = getCategoryInfo(cat.name);
        const icon = info.icon || '•';
        return `${icon} ${info.displayName} (${cat.totalCount} tokens)`;
    }).join(', ');
    const totalTokens = categories.reduce((sum, cat) => sum + cat.totalCount, 0);
    return `Found ${categories.length} categories with ${totalTokens} total tokens: ${summary}`;
}
// Utility function to parse multiple token files
export function parseMultipleTokenFiles(filePaths) {
    const parser = new TokenFileParser();
    for (const filePath of filePaths) {
        parser.parseTokenFile(filePath);
    }
    const result = parser.getResults();
    result.fileCount = filePaths.length;
    // Re-categorize tokens using enhanced logic
    result.categories = categorizeTokens(result.allTokens);
    return result;
}
export class TokenReferenceResolver {
    tokenMap = new Map();
    resolvedTokens = new Map();
    resolutionStack = new Set();
    constructor(tokens) {
        // Build token lookup map
        for (const token of tokens) {
            this.tokenMap.set(token.name, token);
            // Also index by path segments for nested references
            const pathKey = token.path.join('.');
            this.tokenMap.set(pathKey, token);
        }
    }
    resolveAllTokens() {
        for (const token of this.tokenMap.values()) {
            if (!this.resolvedTokens.has(token.name)) {
                this.resolveToken(token.name);
            }
        }
        // Return all resolved tokens (unique by name)
        return Array.from(this.resolvedTokens.values());
    }
    resolveToken(tokenName) {
        // Check if already resolved
        if (this.resolvedTokens.has(tokenName)) {
            return this.resolvedTokens.get(tokenName);
        }
        const token = this.tokenMap.get(tokenName);
        if (!token) {
            return null;
        }
        // Check for circular reference
        if (this.resolutionStack.has(tokenName)) {
            const chain = [...this.resolutionStack, tokenName];
            // Mark all tokens in the cycle
            for (const name of chain) {
                const cycTok = this.tokenMap.get(name);
                if (!cycTok)
                    continue;
                const cycResolved = {
                    ...cycTok,
                    originalValue: cycTok.value,
                    resolvedValue: cycTok.value,
                    isResolved: false,
                    hasCircularReference: true,
                    resolutionError: `Circular reference detected: ${chain.join(' → ')}`,
                };
                this.resolvedTokens.set(name, cycResolved);
            }
            // Also attempt to mark counterpart referenced by current token
            const currentRef = this.parseTokenReference(token.value);
            if (typeof currentRef === 'string') {
                const counterpart = this.findReferencedToken(currentRef);
                if (counterpart) {
                    const name = counterpart.name;
                    const cycResolved = {
                        ...counterpart,
                        originalValue: counterpart.value,
                        resolvedValue: counterpart.value,
                        isResolved: false,
                        hasCircularReference: true,
                        resolutionError: `Circular reference detected: ${chain.join(' → ')}`,
                    };
                    this.resolvedTokens.set(name, cycResolved);
                }
            }
            return this.resolvedTokens.get(tokenName);
        }
        // Add to resolution stack
        this.resolutionStack.add(tokenName);
        try {
            const resolvedToken = this.resolveTokenValue(token);
            const existing = this.resolvedTokens.get(tokenName);
            if (existing && (existing.hasCircularReference || (existing.resolutionError && existing.resolutionError.includes('Circular reference')))) {
                return existing;
            }
            this.resolvedTokens.set(tokenName, resolvedToken);
            return resolvedToken;
        }
        finally {
            // Remove from resolution stack
            this.resolutionStack.delete(tokenName);
        }
    }
    resolveTokenValue(token) {
        const baseResolvedToken = {
            ...token,
            originalValue: token.value,
            resolvedValue: token.value,
            isResolved: true,
        };
        // Check if token value is a reference
        if (typeof token.value === 'string' && this.isTokenReference(token.value)) {
            const referenceName = this.parseTokenReference(token.value);
            if (!referenceName) {
                return {
                    ...baseResolvedToken,
                    isResolved: false,
                    resolutionError: `Invalid token reference format: ${token.value}`,
                };
            }
            // Find the referenced token
            const referencedToken = this.findReferencedToken(referenceName);
            if (!referencedToken) {
                return {
                    ...baseResolvedToken,
                    isResolved: false,
                    resolutionError: `Referenced token not found: ${referenceName}`,
                };
            }
            // Recursively resolve the referenced token
            const resolvedReference = this.resolveToken(referencedToken.name);
            if (!resolvedReference || !resolvedReference.isResolved) {
                return {
                    ...baseResolvedToken,
                    referencePath: referenceName,
                    isResolved: false,
                    resolutionError: resolvedReference?.resolutionError || `Failed to resolve reference: ${referenceName}`,
                };
            }
            const finalResolved = {
                ...baseResolvedToken,
                resolvedValue: resolvedReference.resolvedValue,
                referencePath: referenceName,
                isResolved: true,
            };
            // If the referenced token was part of a cycle and marked, propagate marking to current token as well
            if (resolvedReference.hasCircularReference || (resolvedReference.resolutionError && resolvedReference.resolutionError.includes('Circular reference'))) {
                finalResolved.isResolved = false;
                finalResolved.hasCircularReference = true;
                finalResolved.resolutionError = resolvedReference.resolutionError;
            }
            return finalResolved;
        }
        // Handle composite tokens with potential references
        if (typeof token.value === 'object' && token.value !== null) {
            const resolvedComposite = this.resolveCompositeValue(token.value);
            return {
                ...baseResolvedToken,
                resolvedValue: resolvedComposite.value,
                isResolved: resolvedComposite.isResolved,
                resolutionError: resolvedComposite.error,
            };
        }
        // No resolution needed for primitive values
        return baseResolvedToken;
    }
    resolveCompositeValue(value) {
        if (Array.isArray(value)) {
            const resolvedArray = [];
            let allResolved = true;
            let errors = [];
            for (const item of value) {
                if (typeof item === 'string' && this.isTokenReference(item)) {
                    const referenceName = this.parseTokenReference(item);
                    if (referenceName) {
                        const referencedToken = this.findReferencedToken(referenceName);
                        if (referencedToken) {
                            const resolved = this.resolveToken(referencedToken.name);
                            if (resolved && resolved.isResolved) {
                                resolvedArray.push(resolved.resolvedValue);
                            }
                            else {
                                resolvedArray.push(item);
                                allResolved = false;
                                if (resolved?.resolutionError) {
                                    errors.push(resolved.resolutionError);
                                }
                            }
                        }
                        else {
                            resolvedArray.push(item);
                            allResolved = false;
                            errors.push(`Referenced token not found: ${referenceName}`);
                        }
                    }
                    else {
                        resolvedArray.push(item);
                        allResolved = false;
                        errors.push(`Invalid token reference: ${item}`);
                    }
                }
                else if (typeof item === 'object' && item !== null) {
                    const resolved = this.resolveCompositeValue(item);
                    resolvedArray.push(resolved.value);
                    if (!resolved.isResolved) {
                        allResolved = false;
                        if (resolved.error)
                            errors.push(resolved.error);
                    }
                }
                else {
                    resolvedArray.push(item);
                }
            }
            return {
                value: resolvedArray,
                isResolved: allResolved,
                error: errors.length > 0 ? errors.join('; ') : undefined,
            };
        }
        if (typeof value === 'object' && value !== null) {
            const resolvedObject = {};
            let allResolved = true;
            let errors = [];
            for (const [key, val] of Object.entries(value)) {
                if (typeof val === 'string' && this.isTokenReference(val)) {
                    const referenceName = this.parseTokenReference(val);
                    if (referenceName) {
                        const referencedToken = this.findReferencedToken(referenceName);
                        if (referencedToken) {
                            const resolved = this.resolveToken(referencedToken.name);
                            if (resolved && resolved.isResolved) {
                                resolvedObject[key] = resolved.resolvedValue;
                            }
                            else {
                                resolvedObject[key] = val;
                                allResolved = false;
                                if (resolved?.resolutionError) {
                                    errors.push(`${key}: ${resolved.resolutionError}`);
                                }
                            }
                        }
                        else {
                            resolvedObject[key] = val;
                            allResolved = false;
                            errors.push(`${key}: Referenced token not found: ${referenceName}`);
                        }
                    }
                    else {
                        resolvedObject[key] = val;
                        allResolved = false;
                        errors.push(`${key}: Invalid token reference: ${val}`);
                    }
                }
                else if (typeof val === 'object' && val !== null) {
                    const resolved = this.resolveCompositeValue(val);
                    resolvedObject[key] = resolved.value;
                    if (!resolved.isResolved) {
                        allResolved = false;
                        if (resolved.error)
                            errors.push(`${key}: ${resolved.error}`);
                    }
                }
                else {
                    resolvedObject[key] = val;
                }
            }
            return {
                value: resolvedObject,
                isResolved: allResolved,
                error: errors.length > 0 ? errors.join('; ') : undefined,
            };
        }
        return { value, isResolved: true };
    }
    isTokenReference(value) {
        return /^\{[^}]+\}$/.test(value);
    }
    parseTokenReference(reference) {
        const match = reference.match(/^\{([^}]+)\}$/);
        return match ? match[1] : null;
    }
    findReferencedToken(referenceName) {
        // Try exact name match first
        let token = this.tokenMap.get(referenceName);
        if (token)
            return token;
        // Try path-based lookup (e.g., "colors.primary.500")
        token = this.tokenMap.get(referenceName);
        if (token)
            return token;
        // Try converting dots to dashes (e.g., "colors.primary.500" -> "colors-primary-500")
        const dashName = referenceName.replace(/\./g, '-');
        token = this.tokenMap.get(dashName);
        if (token)
            return token;
        // Try converting dashes to dots
        const dotName = referenceName.replace(/-/g, '.');
        token = this.tokenMap.get(dotName);
        if (token)
            return token;
        // Try partial path matching
        for (const [, tokenValue] of this.tokenMap.entries()) {
            if (tokenValue.path.join('.') === referenceName) {
                return tokenValue;
            }
        }
        // Try last segment match
        const lastSeg = referenceName.split(/[.-]/).pop();
        if (lastSeg) {
            for (const val of this.tokenMap.values()) {
                const tokenLast = val.path[val.path.length - 1];
                if (tokenLast === lastSeg)
                    return val;
                if (val.name.endsWith(`-${lastSeg}`))
                    return val;
            }
        }
        return undefined;
    }
}
// Utility functions for token reference resolution
export function resolveTokenReferences(tokens) {
    const resolver = new TokenReferenceResolver(tokens);
    return resolver.resolveAllTokens();
}
export function getUnresolvedTokens(resolvedTokens) {
    return resolvedTokens.filter(token => !token.isResolved);
}
export function getCircularReferences(resolvedTokens) {
    return resolvedTokens.filter(token => token.hasCircularReference || (typeof token.resolutionError === 'string' && token.resolutionError.includes('Circular reference')));
}
// Comprehensive error handling for malformed token files
export var TokenErrorType;
(function (TokenErrorType) {
    TokenErrorType["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    TokenErrorType["INVALID_JSON"] = "INVALID_JSON";
    TokenErrorType["SCHEMA_VALIDATION"] = "SCHEMA_VALIDATION";
    TokenErrorType["MISSING_VALUE"] = "MISSING_VALUE";
    TokenErrorType["MISSING_TYPE"] = "MISSING_TYPE";
    TokenErrorType["INVALID_TYPE"] = "INVALID_TYPE";
    TokenErrorType["INVALID_REFERENCE"] = "INVALID_REFERENCE";
    TokenErrorType["CIRCULAR_REFERENCE"] = "CIRCULAR_REFERENCE";
    TokenErrorType["UNRESOLVED_REFERENCE"] = "UNRESOLVED_REFERENCE";
    TokenErrorType["COMPOSITE_TOKEN_ERROR"] = "COMPOSITE_TOKEN_ERROR";
})(TokenErrorType || (TokenErrorType = {}));
export class TokenValidationError extends Error {
    errors;
    constructor(errors) {
        const message = `Token validation failed with ${errors.length} error${errors.length > 1 ? 's' : ''}:\n${errors.map(err => `  ${err.message}`).join('\n')}`;
        super(message);
        this.name = 'TokenValidationError';
        this.errors = errors;
    }
}
export class TokenFileValidator {
    errors = [];
    validateTokenFile(filePath, content) {
        this.errors = [];
        const fileName = filePath.split('/').pop() || filePath;
        try {
            // Read file if content not provided
            let fileContent = content;
            if (!fileContent) {
                try {
                    fileContent = readFileSync(filePath, 'utf8');
                }
                catch (error) {
                    this.addError({
                        type: TokenErrorType.FILE_NOT_FOUND,
                        message: `File not found: ${fileName}`,
                        file: fileName,
                        suggestion: 'Check that the file path is correct and the file exists',
                    });
                    return this.errors;
                }
            }
            // Parse JSON
            let parsedData;
            try {
                parsedData = JSON.parse(fileContent);
            }
            catch (error) {
                const syntaxError = error;
                const lineMatch = syntaxError.message.match(/at position (\d+)/);
                let line;
                let column;
                if (lineMatch) {
                    const position = parseInt(lineMatch[1]);
                    const lines = fileContent.substring(0, position).split('\n');
                    line = lines.length;
                    column = lines[lines.length - 1].length + 1;
                }
                this.addError({
                    type: TokenErrorType.INVALID_JSON,
                    message: `Invalid JSON in ${fileName}: ${syntaxError.message}`,
                    file: fileName,
                    line,
                    column,
                    suggestion: 'Check for missing commas, quotes, or brackets',
                });
                return this.errors;
            }
            // Validate against W3C schema
            try {
                validateDesignTokensFile(parsedData);
            }
            catch (error) {
                if (error instanceof Error) {
                    // Parse Zod validation errors for specific feedback
                    this.parseZodValidationError(error, fileName);
                }
                // Also run semantic validation to surface detailed issues (missing $value, etc.)
                this.validateTokenSemantics(parsedData, [], fileName);
                return this.errors;
            }
            // Additional semantic validation
            this.validateTokenSemantics(parsedData, [], fileName);
            // Shallow pass to ensure required property errors are emitted even if schema accepted structure
            const shallowCheck = (node, p = []) => {
                if (node && typeof node === 'object') {
                    for (const [k, v] of Object.entries(node)) {
                        if (k.startsWith('$'))
                            continue;
                        if (v && typeof v === 'object') {
                            const hasType = Object.prototype.hasOwnProperty.call(v, '$type');
                            const hasValue = Object.prototype.hasOwnProperty.call(v, '$value');
                            if (hasType && !hasValue) {
                                this.addError({
                                    type: TokenErrorType.MISSING_VALUE,
                                    message: `${fileName} at "${[...p, k].join('.')}": Token missing required "$value" property`,
                                    file: fileName,
                                    tokenPath: [...p, k],
                                    tokenName: [...p, k].join('-'),
                                    suggestion: 'Add a "$value" property with the token\'s value',
                                });
                            }
                            if (hasType && typeof v.$value === 'object') {
                                const t = v.$type;
                                if (t === 'typography')
                                    this.validateTypographyToken(v.$value, [...p, k], fileName);
                                if (t === 'border')
                                    this.validateBorderToken(v.$value, [...p, k], fileName);
                                if (t === 'shadow')
                                    this.validateShadowToken(v.$value, [...p, k], fileName);
                            }
                        }
                    }
                }
            };
            shallowCheck(parsedData, []);
        }
        catch (error) {
            this.addError({
                type: TokenErrorType.SCHEMA_VALIDATION,
                message: `Unexpected validation error in ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                file: fileName,
            });
        }
        return this.errors;
    }
    addError(error) {
        this.errors.push(error);
    }
    parseZodValidationError(error, fileName) {
        const message = error.message;
        // Parse Zod error details
        const lines = message.split('\n').slice(1); // Skip "Invalid W3C Design Token file:" line
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            // Parse error format: "path: message"
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex === -1)
                continue;
            const path = trimmed.substring(0, colonIndex).trim();
            const errorMessage = trimmed.substring(colonIndex + 1).trim();
            const pathParts = path ? path.split('.') : [];
            // Determine error type and provide suggestions
            const { type, suggestion } = this.categorizeValidationError(errorMessage);
            this.addError({
                type,
                message: `${fileName}${path ? ` at "${path}"` : ''}: ${errorMessage}`,
                file: fileName,
                tokenPath: pathParts,
                tokenName: pathParts.join('-'),
                suggestion,
            });
        }
    }
    categorizeValidationError(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('required') && lowerMessage.includes('$value')) {
            return {
                type: TokenErrorType.MISSING_VALUE,
                suggestion: 'Add a "$value" property with the token\'s value',
            };
        }
        if (lowerMessage.includes('required') && lowerMessage.includes('$type')) {
            return {
                type: TokenErrorType.MISSING_TYPE,
                suggestion: 'Add a "$type" property specifying the token type (e.g., "color", "dimension")',
            };
        }
        if (lowerMessage.includes('invalid enum value') || lowerMessage.includes('expected')) {
            return {
                type: TokenErrorType.INVALID_TYPE,
                suggestion: 'Check the W3C Design Token specification for valid token types',
            };
        }
        return {
            type: TokenErrorType.SCHEMA_VALIDATION,
        };
    }
    validateTokenSemantics(group, path, fileName) {
        if (typeof group !== 'object' || group === null)
            return;
        for (const [key, value] of Object.entries(group)) {
            // Skip metadata properties
            if (key.startsWith('$'))
                continue;
            const currentPath = [...path, key];
            if (isToken(value)) {
                this.validateToken(value, currentPath, fileName);
            }
            else if (typeof value === 'object' && value !== null) {
                // If it looks like a token (has $type or $value) but doesn't match token schema, record specific issues
                const hasType = Object.prototype.hasOwnProperty.call(value, '$type');
                const hasValue = Object.prototype.hasOwnProperty.call(value, '$value');
                if (hasType && !hasValue) {
                    this.addError({
                        type: TokenErrorType.MISSING_VALUE,
                        message: `${fileName} at "${currentPath.join('.')}": Token missing required "$value" property`,
                        file: fileName,
                        tokenPath: currentPath,
                        tokenName: currentPath.join('-'),
                        suggestion: 'Add a "$value" property with the token\'s value',
                    });
                }
                if (hasValue && !hasType) {
                    this.addError({
                        type: TokenErrorType.MISSING_TYPE,
                        message: `${fileName} at "${currentPath.join('.')}": Token missing required "$type" property`,
                        file: fileName,
                        tokenPath: currentPath,
                        tokenName: currentPath.join('-'),
                        suggestion: 'Add a "$type" property specifying the token type (e.g., "color", "dimension")',
                    });
                }
                // If $type exists and $value is object, run type-specific validators to surface detailed errors
                if (hasType && typeof value.$value === 'object') {
                    const t = value.$type;
                    const v = value.$value;
                    if (t === 'typography')
                        this.validateTypographyToken(v, currentPath, fileName);
                    if (t === 'border')
                        this.validateBorderToken(v, currentPath, fileName);
                    if (t === 'shadow')
                        this.validateShadowToken(v, currentPath, fileName);
                }
                // Recursively validate nested groups
                this.validateTokenSemantics(value, currentPath, fileName);
            }
            else {
                this.addError({
                    type: TokenErrorType.SCHEMA_VALIDATION,
                    message: `${fileName} at "${currentPath.join('.')}": Invalid token or group structure`,
                    file: fileName,
                    tokenPath: currentPath,
                    suggestion: 'Tokens must have $value property, groups must contain tokens or other groups',
                });
            }
        }
    }
    validateToken(token, path, fileName) {
        const tokenName = path.join('-');
        // Check for missing $value
        if (token.$value === undefined) {
            this.addError({
                type: TokenErrorType.MISSING_VALUE,
                message: `${fileName} at "${path.join('.')}": Token missing required "$value" property`,
                file: fileName,
                tokenPath: path,
                tokenName,
                suggestion: 'Add a "$value" property with the token\'s value',
            });
        }
        // Validate token references
        if (typeof token.$value === 'string' && isTokenReference({ $value: token.$value })) {
            this.validateTokenReference(token.$value, path, fileName);
        }
        // Validate composite token values
        if (typeof token.$value === 'object' && token.$value !== null) {
            this.validateCompositeTokenValue(token.$value, path, fileName);
        }
        // Validate typography tokens specifically
        if (token.$type === 'typography' && typeof token.$value === 'object') {
            this.validateTypographyToken(token.$value, path, fileName);
        }
        // Validate border tokens specifically
        if (token.$type === 'border' && typeof token.$value === 'object') {
            this.validateBorderToken(token.$value, path, fileName);
        }
        // Validate shadow tokens specifically
        if (token.$type === 'shadow') {
            this.validateShadowToken(token.$value, path, fileName);
        }
    }
    validateTokenReference(reference, path, fileName) {
        if (!reference.match(/^\{[^}]+\}$/)) {
            this.addError({
                type: TokenErrorType.INVALID_REFERENCE,
                message: `${fileName} at "${path.join('.')}": Invalid token reference format "${reference}"`,
                file: fileName,
                tokenPath: path,
                tokenName: path.join('-'),
                suggestion: 'Token references must be in format "{token.name}" or "{category.token}"',
            });
        }
    }
    validateCompositeTokenValue(value, path, fileName) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (typeof item === 'string' && item.match(/^\{[^}]+\}$/)) {
                    this.validateTokenReference(item, [...path, `[${index}]`], fileName);
                }
                else if (typeof item === 'object' && item !== null) {
                    this.validateCompositeTokenValue(item, [...path, `[${index}]`], fileName);
                }
            });
        }
        else if (typeof value === 'object' && value !== null) {
            for (const [key, val] of Object.entries(value)) {
                if (typeof val === 'string' && val.match(/^\{[^}]+\}$/)) {
                    this.validateTokenReference(val, [...path, key], fileName);
                }
                else if (typeof val === 'object' && val !== null) {
                    this.validateCompositeTokenValue(val, [...path, key], fileName);
                }
            }
        }
    }
    validateTypographyToken(value, path, fileName) {
        const required = ['fontFamily', 'fontSize'];
        const optional = ['fontWeight', 'letterSpacing', 'lineHeight'];
        const allowed = [...required, ...optional];
        for (const prop of required) {
            if (value[prop] === undefined) {
                this.addError({
                    type: TokenErrorType.MISSING_VALUE,
                    message: `${fileName} at "${path.join('.')}": Typography token missing required "${prop}" property`,
                    file: fileName,
                    tokenPath: path,
                    tokenName: path.join('-'),
                    suggestion: `Add "${prop}" property to typography token`,
                });
            }
        }
        for (const prop of Object.keys(value)) {
            if (!allowed.includes(prop)) {
                this.addError({
                    type: TokenErrorType.INVALID_TYPE,
                    message: `${fileName} at "${path.join('.')}": Typography token has invalid property "${prop}"`,
                    file: fileName,
                    tokenPath: path,
                    tokenName: path.join('-'),
                    suggestion: `Valid typography properties: ${allowed.join(', ')}`,
                });
            }
        }
    }
    validateBorderToken(value, path, fileName) {
        const required = ['color', 'width', 'style'];
        for (const prop of required) {
            if (value[prop] === undefined) {
                this.addError({
                    type: TokenErrorType.MISSING_VALUE,
                    message: `${fileName} at "${path.join('.')}": Border token missing required "${prop}" property`,
                    file: fileName,
                    tokenPath: path,
                    tokenName: path.join('-'),
                    suggestion: `Add "${prop}" property to border token`,
                });
            }
        }
    }
    validateShadowToken(value, path, fileName) {
        const validateSingleShadow = (shadow, shadowPath) => {
            const required = ['color', 'offsetX', 'offsetY', 'blur'];
            const optional = ['spread'];
            const allowed = [...required, ...optional];
            for (const prop of required) {
                if (shadow[prop] === undefined) {
                    this.addError({
                        type: TokenErrorType.MISSING_VALUE,
                        message: `${fileName} at "${shadowPath.join('.')}": Shadow token missing required "${prop}" property`,
                        file: fileName,
                        tokenPath: shadowPath,
                        tokenName: path.join('-'),
                        suggestion: `Add "${prop}" property to shadow token`,
                    });
                }
            }
            for (const prop of Object.keys(shadow)) {
                if (!allowed.includes(prop)) {
                    this.addError({
                        type: TokenErrorType.INVALID_TYPE,
                        message: `${fileName} at "${shadowPath.join('.')}": Shadow token has invalid property "${prop}"`,
                        file: fileName,
                        tokenPath: shadowPath,
                        tokenName: path.join('-'),
                        suggestion: `Valid shadow properties: ${allowed.join(', ')}`,
                    });
                }
            }
        };
        if (Array.isArray(value)) {
            value.forEach((shadow, index) => {
                if (typeof shadow === 'object' && shadow !== null) {
                    validateSingleShadow(shadow, [...path, `[${index}]`]);
                }
            });
        }
        else if (typeof value === 'object' && value !== null) {
            validateSingleShadow(value, path);
        }
    }
}
// Enhanced error formatting utilities
export function formatTokenError(error) {
    let message = error.message;
    if (error.line && error.column) {
        message += ` (line ${error.line}, column ${error.column})`;
    }
    if (error.suggestion) {
        message += `\n  💡 Suggestion: ${error.suggestion}`;
    }
    return message;
}
export function formatTokenErrors(errors) {
    if (errors.length === 0)
        return 'No errors found';
    const grouped = groupErrorsByFile(errors);
    const parts = [];
    for (const [fileName, fileErrors] of grouped.entries()) {
        parts.push(`📄 ${fileName} (${fileErrors.length} error${fileErrors.length > 1 ? 's' : ''}):`);
        for (const error of fileErrors) {
            parts.push(`  ❌ ${formatTokenError(error)}`);
        }
        parts.push('');
    }
    return parts.join('\n');
}
function groupErrorsByFile(errors) {
    const grouped = new Map();
    for (const error of errors) {
        const fileName = error.file || 'unknown';
        if (!grouped.has(fileName)) {
            grouped.set(fileName, []);
        }
        grouped.get(fileName).push(error);
    }
    return grouped;
}
// Validation utility functions
export function validateTokenFiles(filePaths) {
    const validator = new TokenFileValidator();
    const allErrors = [];
    for (const filePath of filePaths) {
        const errors = validator.validateTokenFile(filePath);
        allErrors.push(...errors);
    }
    return allErrors;
}
export function hasValidationErrors(result) {
    return result.errors.length > 0;
}
export function getValidationSummary(errors) {
    if (errors.length === 0)
        return '✅ All token files are valid';
    const errorTypes = new Map();
    for (const error of errors) {
        errorTypes.set(error.type, (errorTypes.get(error.type) || 0) + 1);
    }
    const summary = Array.from(errorTypes.entries())
        .map(([type, count]) => `${count} ${type.toLowerCase().replace(/_/g, ' ')}`)
        .join(', ');
    return `❌ Found ${errors.length} validation error${errors.length > 1 ? 's' : ''}: ${summary}`;
}
