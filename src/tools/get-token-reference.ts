import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { discoverDesignTokensWithErrorHandling } from '../discovery.js';
import { resolveTokenReferences, getCategoryInfo } from '../parsers/w3c-tokens.js';

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
  
  // Format variations
  cssVariable: string;
  cssClass: string;
  sassVariable: string;
  lessVariable: string;
  jsConstant: string;
  
  // Usage information
  usage: string;
  examples: CodeExample[];
  platforms: PlatformUsage[];
  
  // Related information
  relatedTokens: RelatedToken[];
  tokenHierarchy?: TokenHierarchy;
  
  // Resolution information
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

export const TokenReferenceArgsSchema = z.object({
  category: z.string(),
  name: z.string(),
  directory: z.string().optional(),
  includeExamples: z.boolean().optional(),
  includeRelated: z.boolean().optional(),
});

export async function getTokenReference(args: TokenReferenceArgs): Promise<TokenReferenceResult> {
  const { 
    category, 
    name, 
    directory, 
    includeExamples = true, 
    includeRelated = true 
  } = TokenReferenceArgsSchema.parse(args);

  try {
    const { result } = discoverDesignTokensWithErrorHandling(directory);

    // Find the category
    const categoryData = result.parsedResult.categories.find(cat => cat.name === category);
    if (!categoryData) {
      const availableCategories = result.parsedResult.categories.map(c => c.name);
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Category "${category}" not found. Available categories: ${availableCategories.join(', ')}`
      );
    }

    // Find the token
    const token = categoryData.tokens.find(t => t.name === name);
    if (!token) {
      const availableTokens = categoryData.tokens.slice(0, 10).map(t => t.name);
      const moreTokens = categoryData.tokens.length > 10 ? ` ... and ${categoryData.tokens.length - 10} more` : '';
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Token "${name}" not found in category "${category}". Available tokens: ${availableTokens.join(', ')}${moreTokens}`
      );
    }

    // Resolve token references
    const resolvedTokens = resolveTokenReferences([token]);
    const resolvedToken = resolvedTokens[0];

    // Build detailed token reference
    const tokenReference: TokenReference = {
      name: token.name,
      path: token.path,
      category: category,
      value: token.value,
      resolvedValue: resolvedToken.resolvedValue !== token.value ? resolvedToken.resolvedValue : undefined,
      type: token.type,
      description: token.description,
      
      // Format variations
      cssVariable: generateCSSVariable(token.name),
      cssClass: generateCSSClass(token.name),
      sassVariable: generateSassVariable(token.name),
      lessVariable: generateLessVariable(token.name),
      jsConstant: generateJSConstant(token.name),
      
      // Usage information
      usage: getDetailedUsageInformation(token.type, token.path, resolvedToken.resolvedValue),
      examples: includeExamples ? generateCodeExamples(token.type, token.name, resolvedToken.resolvedValue) : [],
      platforms: generatePlatformUsage(token.type, token.name, resolvedToken.resolvedValue),
      
      // Related information
      relatedTokens: includeRelated ? findRelatedTokens(token, categoryData.tokens) : [],
      tokenHierarchy: analyzeTokenHierarchy(token, categoryData.tokens),
      
      // Resolution information
      isResolved: resolvedToken.isResolved,
      referencePath: resolvedToken.referencePath,
      resolutionError: resolvedToken.resolutionError,
    };

    // Generate recommendations
    const recommendations = generateRecommendations(tokenReference);
    const nextSteps = generateNextSteps(tokenReference, category);

    return {
      success: true,
      token: tokenReference,
      recommendations,
      nextSteps,
    };

  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get token reference: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function generateCSSVariable(tokenName: string): string {
  return `--${tokenName.replace(/\./g, '-')}`;
}

function generateCSSClass(tokenName: string): string {
  return `.${tokenName.replace(/\./g, '-')}`;
}

function generateSassVariable(tokenName: string): string {
  return `$${tokenName.replace(/\./g, '-')}`;
}

function generateLessVariable(tokenName: string): string {
  return `@${tokenName.replace(/\./g, '-')}`;
}

function generateJSConstant(tokenName: string): string {
  return tokenName.replace(/[\.-]/g, '_').toUpperCase();
}

function getDetailedUsageInformation(type?: string, path?: string[], value?: any): string {
  if (!type) return 'General purpose design token';

  const baseUsage: Record<string, string> = {
    color: 'Apply to color-related CSS properties (color, background-color, border-color, fill, stroke)',
    dimension: 'Use for sizing and spacing properties (width, height, margin, padding, gap, border-width)',
    fontFamily: 'Apply to font-family CSS property for consistent typography',
    fontWeight: 'Use for font-weight CSS property to control text thickness',
    typography: 'Complete typography styling including font, size, weight, and line-height',
    border: 'Apply as border shorthand property combining width, style, and color',
    shadow: 'Use for box-shadow property to add depth and elevation',
    duration: 'Apply to animation-duration and transition-duration properties',
    cubicBezier: 'Use as timing function for animation-timing-function and transition-timing-function',
  };

  let usage = baseUsage[type] || `Use for ${type}-related properties`;

  // Add semantic context based on path
  if (path && path.length >= 2) {
    const semanticContext = getSemanticContext(path, type);
    if (semanticContext) {
      usage = `${semanticContext} ${usage}`;
    }
  }

  // Add value-specific guidance
  if (value && type === 'color') {
    usage += `. Color value: ${value}`;
    if (typeof value === 'string' && value.startsWith('#')) {
      usage += ` (hex format)`;
    }
  }

  return usage;
}

function getSemanticContext(path: string[], type?: string): string | null {
  const semanticMap: Record<string, Record<string, string>> = {
    color: {
      primary: 'Primary brand color for main actions and key UI elements.',
      secondary: 'Secondary color for supporting elements and less prominent actions.',
      error: 'Error state color for validation messages and destructive actions.',
      warning: 'Warning state color for caution messages and important notices.',
      success: 'Success state color for positive feedback and completion states.',
      neutral: 'Neutral color for text, borders, and background elements.',
      info: 'Informational color for helpful messages and status indicators.',
    },
    typography: {
      heading: 'Heading typography for titles and section headers.',
      body: 'Body text typography for main content and descriptions.',
      caption: 'Caption typography for small text and annotations.',
      label: 'Label typography for form fields and UI element labels.',
    },
    spacing: {
      xs: 'Extra small spacing for tight layouts and subtle separation.',
      sm: 'Small spacing for compact interfaces and close-related elements.',
      md: 'Medium spacing for standard layouts and general separation.',
      lg: 'Large spacing for generous layouts and distinct sections.',
      xl: 'Extra large spacing for prominent separation and breathing room.',
    },
  };

  if (type && semanticMap[type] && path.length >= 2) {
    const semanticKey = path[1].toLowerCase();
    return semanticMap[type][semanticKey] || null;
  }

  return null;
}

function generateCodeExamples(type?: string, name?: string, value?: any): CodeExample[] {
  if (!type || !name || value === undefined) return [];

  const cssVar = generateCSSVariable(name);
  const examples: CodeExample[] = [];

  switch (type) {
    case 'color':
      examples.push(
        {
          language: 'css',
          code: `/* Text color */\n.text { color: var(${cssVar}); }\n\n/* Background */\n.bg { background-color: var(${cssVar}); }\n\n/* Border */\n.border { border-color: var(${cssVar}); }`,
          description: 'Apply color token to various CSS properties',
        },
        {
          language: 'css',
          framework: 'Tailwind CSS',
          code: `<!-- Using arbitrary values -->\n<div class="text-[var(${cssVar})] bg-[var(${cssVar})]">Content</div>`,
          description: 'Use with Tailwind CSS arbitrary value syntax',
        }
      );
      break;

    case 'dimension':
      examples.push(
        {
          language: 'css',
          code: `/* Spacing */\n.spacing { margin: var(${cssVar}); padding: var(${cssVar}); }\n\n/* Sizing */\n.size { width: var(${cssVar}); height: var(${cssVar}); }`,
          description: 'Apply dimension token for spacing and sizing',
        }
      );
      break;

    case 'typography':
      examples.push(
        {
          language: 'css',
          code: `/* Complete typography styling */\n.heading {\n  font-family: var(${cssVar}-font-family);\n  font-size: var(${cssVar}-font-size);\n  font-weight: var(${cssVar}-font-weight);\n  line-height: var(${cssVar}-line-height);\n}`,
          description: 'Apply typography token properties',
        }
      );
      break;

    case 'shadow':
      examples.push(
        {
          language: 'css',
          code: `/* Box shadow */\n.elevated { box-shadow: var(${cssVar}); }\n\n/* Multiple shadows */\n.complex { box-shadow: var(${cssVar}), inset 0 1px 0 rgba(255,255,255,0.1); }`,
          description: 'Apply shadow token for elevation effects',
        }
      );
      break;
  }

  // Add React/JSX example for applicable tokens
  if (type === 'color' || type === 'dimension') {
    examples.push({
      language: 'jsx',
      framework: 'React',
      code: `const MyComponent = () => (\n  <div style={{\n    color: 'var(${cssVar})',\n    padding: 'var(${cssVar})'\n  }}>\n    Content\n  </div>\n);`,
      description: 'Use token in React inline styles',
    });
  }

  return examples;
}

function generatePlatformUsage(type?: string, name?: string, value?: any): PlatformUsage[] {
  if (!name || value === undefined) return [];

  const cssVar = generateCSSVariable(name);
  const sassVar = generateSassVariable(name);
  const jsConst = generateJSConstant(name);

  return [
    {
      platform: 'CSS',
      format: 'CSS Custom Property',
      example: `var(${cssVar})`,
    },
    {
      platform: 'Sass',
      format: 'Sass Variable',
      example: `${sassVar}`,
    },
    {
      platform: 'JavaScript',
      format: 'JavaScript Constant',
      example: `const ${jsConst} = '${value}';`,
    },
    {
      platform: 'TypeScript',
      format: 'TypeScript Constant',
      example: `const ${jsConst}: string = '${value}';`,
    },
    {
      platform: 'JSON',
      format: 'Design Token JSON',
      example: `"${name}": { "$type": "${type}", "$value": "${value}" }`,
    },
  ];
}

function findRelatedTokens(currentToken: any, allTokens: any[]): RelatedToken[] {
  const related: RelatedToken[] = [];

  for (const token of allTokens) {
    if (token.name === currentToken.name) continue;

    const relationship = determineTokenRelationship(currentToken, token);
    if (relationship) {
      related.push({
        name: token.name,
        relationship: relationship.type,
        description: relationship.description,
      });
    }
  }

  return related.slice(0, 8); // Limit to 8 related tokens
}

function determineTokenRelationship(token1: any, token2: any): { type: RelatedToken['relationship']; description?: string } | null {
  // Same type tokens
  if (token1.type === token2.type && token1.type) {
    // Check for variant relationship (same base path)
    if (token1.path.length === token2.path.length) {
      const commonPath = token1.path.slice(0, -1);
      const otherCommonPath = token2.path.slice(0, -1);
      if (commonPath.join('.') === otherCommonPath.join('.')) {
        return { type: 'variant', description: `${token1.type} variant in same group` };
      }
    }

    // Check for hierarchy
    if (token2.path.length === token1.path.length + 1 && 
        token2.path.slice(0, -1).join('.') === token1.path.join('.')) {
      return { type: 'child', description: 'More specific variant' };
    }

    if (token1.path.length === token2.path.length + 1 && 
        token1.path.slice(0, -1).join('.') === token2.path.join('.')) {
      return { type: 'parent', description: 'More general variant' };
    }
  }

  // Semantic relationships
  const semanticPairs = [
    ['primary', 'secondary'],
    ['light', 'dark'],
    ['success', 'error'],
    ['xs', 'sm'], ['sm', 'md'], ['md', 'lg'], ['lg', 'xl'],
  ];

  for (const [first, second] of semanticPairs) {
    if ((token1.name.includes(first) && token2.name.includes(second)) ||
        (token1.name.includes(second) && token2.name.includes(first))) {
      return { type: 'semantic', description: 'Semantically related tokens' };
    }
  }

  // Sibling relationship (same parent path)
  if (token1.path.length > 1 && token2.path.length > 1) {
    const parentPath1 = token1.path.slice(0, -1).join('.');
    const parentPath2 = token2.path.slice(0, -1).join('.');
    if (parentPath1 === parentPath2) {
      return { type: 'sibling', description: 'Token in same group' };
    }
  }

  return null;
}

function analyzeTokenHierarchy(currentToken: any, allTokens: any[]): TokenHierarchy {
  const hierarchy: TokenHierarchy = {
    children: [],
    variants: [],
  };

  const currentPath = currentToken.path.join('.');

  for (const token of allTokens) {
    if (token.name === currentToken.name) continue;

    const tokenPath = token.path.join('.');

    // Find parent (one level up)
    if (currentToken.path.length > 1) {
      const parentPath = currentToken.path.slice(0, -1).join('.');
      if (tokenPath === parentPath) {
        hierarchy.parent = token.name;
      }
    }

    // Find children (one level down)
    if (tokenPath.startsWith(currentPath + '.') && 
        token.path.length === currentToken.path.length + 1) {
      hierarchy.children.push(token.name);
    }

    // Find variants (same level, same parent)
    if (token.path.length === currentToken.path.length) {
      const parentPath = currentToken.path.slice(0, -1).join('.');
      const tokenParentPath = token.path.slice(0, -1).join('.');
      if (parentPath === tokenParentPath) {
        hierarchy.variants.push(token.name);
      }
    }
  }

  return hierarchy;
}

function generateRecommendations(tokenRef: TokenReference): string[] {
  const recommendations: string[] = [];

  // Resolution-based recommendations
  if (!tokenRef.isResolved && tokenRef.resolutionError) {
    recommendations.push(`⚠️ Token reference issue: ${tokenRef.resolutionError}`);
  }

  // Type-specific recommendations
  if (tokenRef.type === 'color') {
    recommendations.push('🎨 Consider accessibility: Ensure sufficient color contrast when using this token');
    if (tokenRef.name.includes('text') || tokenRef.name.includes('foreground')) {
      recommendations.push('📝 Text color: Test readability against background colors');
    }
  }

  if (tokenRef.type === 'typography') {
    recommendations.push('📖 Typography: Use this token for consistent text hierarchy');
    recommendations.push('🔤 Combine with color tokens for complete text styling');
  }

  if (tokenRef.type === 'spacing') {
    recommendations.push('📏 Spacing: Use consistently for margins, padding, and layout gaps');
  }

  // Hierarchy-based recommendations
  if (tokenRef.tokenHierarchy?.children.length) {
    recommendations.push(`🌳 This token has ${tokenRef.tokenHierarchy.children.length} child variants available`);
  }

  if (tokenRef.relatedTokens.length > 0) {
    const variantCount = tokenRef.relatedTokens.filter(t => t.relationship === 'variant').length;
    if (variantCount > 0) {
      recommendations.push(`🔀 ${variantCount} variants available for different use cases`);
    }
  }

  // Usage recommendations
  recommendations.push('💡 Use CSS custom properties for better maintainability and theming support');

  return recommendations;
}

function generateNextSteps(tokenRef: TokenReference, category: string): string[] {
  const nextSteps: string[] = [];

  // Immediate actions
  nextSteps.push(`Copy and use: var(${tokenRef.cssVariable})`);
  
  if (tokenRef.examples.length > 0) {
    nextSteps.push('Review the code examples above for implementation guidance');
  }

  // Related exploration
  if (tokenRef.relatedTokens.length > 0) {
    const relatedSuggestion = tokenRef.relatedTokens
      .slice(0, 2)
      .map(t => `get_token_reference(category: "${category}", name: "${t.name}")`)
      .join(', ');
    nextSteps.push(`Explore related tokens: ${relatedSuggestion}`);
  }

  // Category exploration
  nextSteps.push(`Use get_category_tokens(category: "${category}") to see all ${category} tokens`);
  nextSteps.push('Use get_design_system_info to explore other token categories');

  // Implementation guidance
  nextSteps.push('Test the token in your design to ensure it meets your needs');
  
  if (tokenRef.type === 'color') {
    nextSteps.push('Verify color contrast accessibility requirements');
  }

  return nextSteps;
}

// Validation helpers
export function validateTokenReferenceRequest(args: any): string[] {
  const issues: string[] = [];

  if (!args.category || typeof args.category !== 'string') {
    issues.push('Category is required and must be a string');
  }

  if (!args.name || typeof args.name !== 'string') {
    issues.push('Token name is required and must be a string');
  }

  if (args.directory && typeof args.directory !== 'string') {
    issues.push('Directory must be a string if provided');
  }

  return issues;
}