import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDesignSystemInfo } from './get-design-system-info.js';
import { getCategoryTokens } from './get-category-tokens.js';
import { getTokenReference } from './get-token-reference.js';
import {
  validateLayer1Args,
  validateLayer2Args,
  validateLayer3Args,
  validateCategoryExists,
  validateTokenExists,
  MCPValidationError,
} from '../validation.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = '/tmp/design-system-mcp-tools-tests';

describe('MCP Tool Functions', () => {
  beforeEach(() => {
    // Clean up and create test directory
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
    mkdirSync(TEST_DIR, { recursive: true });
    
    // Create sample token structure
    const tokensDir = join(TEST_DIR, 'tokens');
    mkdirSync(tokensDir, { recursive: true });
    
    // Create sample token files
    writeFileSync(join(tokensDir, 'colors.json'), JSON.stringify({
      colors: {
        primary: {
          50: { $type: 'color', $value: '#eff6ff', $description: 'Light primary' },
          500: { $type: 'color', $value: '#3b82f6', $description: 'Primary brand color' },
          900: { $type: 'color', $value: '#1e3a8a', $description: 'Dark primary' },
        },
        secondary: {
          500: { $type: 'color', $value: '#64748b', $description: 'Secondary color' },
        },
        error: {
          500: { $type: 'color', $value: '#ef4444', $description: 'Error color' },
        }
      }
    }));

    writeFileSync(join(tokensDir, 'typography.json'), JSON.stringify({
      typography: {
        heading: {
          large: {
            $type: 'typography',
            $value: {
              fontFamily: 'Inter',
              fontSize: '32px',
              fontWeight: 600,
              lineHeight: '1.2'
            },
            $description: 'Large heading typography'
          },
          medium: {
            $type: 'typography', 
            $value: {
              fontFamily: 'Inter',
              fontSize: '24px',
              fontWeight: 500,
              lineHeight: '1.3'
            }
          }
        },
        body: {
          $type: 'typography',
          $value: {
            fontFamily: 'Inter',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '1.5'
          }
        }
      }
    }));

    writeFileSync(join(tokensDir, 'spacing.json'), JSON.stringify({
      spacing: {
        xs: { $type: 'dimension', $value: '4px' },
        sm: { $type: 'dimension', $value: '8px' },
        md: { $type: 'dimension', $value: '16px' },
        lg: { $type: 'dimension', $value: '24px' },
        xl: { $type: 'dimension', $value: '32px' },
      }
    }));
  });

  afterEach(() => {
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
  });

  describe('Layer 1: get_design_system_info', () => {
    it('should discover design system categories', async () => {
      const result = await getDesignSystemInfo({
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.success).toBe(true);
      expect(result.categories).toHaveLength(3);
      expect(result.categories.map(c => c.name)).toContain('colors');
      expect(result.categories.map(c => c.name)).toContain('typography');
      expect(result.categories.map(c => c.name)).toContain('spacing');
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.fileCount).toBe(3);
    });

    it('should provide category details with counts', async () => {
      const result = await getDesignSystemInfo({
        directory: join(TEST_DIR, 'tokens')
      });

      const colorCategory = result.categories.find(c => c.name === 'colors');
      expect(colorCategory).toBeDefined();
      expect(colorCategory!.tokenCount).toBe(5); // primary-50, primary-500, primary-900, secondary-500, error-500
      expect(colorCategory!.displayName).toBe('Colors');
      expect(colorCategory!.description).toContain('color tokens');
      expect(colorCategory!.icon).toBe('🎨');
    });

    it('should include summary and next steps', async () => {
      const result = await getDesignSystemInfo({
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.summary).toContain('categories');
      expect(result.summary).toContain('tokens');
      expect(result.nextSteps).toHaveLength(4);
      expect(result.nextSteps[0]).toContain('get_category_tokens');
    });

    it('should handle missing directory', async () => {
      await expect(getDesignSystemInfo({
        directory: join(TEST_DIR, 'nonexistent')
      })).rejects.toThrow('Cannot access design tokens');
    });

    it('should work without directory parameter', async () => {
      // Set environment variable
      process.env.DESIGN_TOKENS_PATH = join(TEST_DIR, 'tokens');
      
      try {
        const result = await getDesignSystemInfo({});
        expect(result.success).toBe(true);
        expect(result.categories).toHaveLength(3);
      } finally {
        delete process.env.DESIGN_TOKENS_PATH;
      }
    });

    it('should provide setup guidance for empty directories', async () => {
      const emptyDir = join(TEST_DIR, 'empty');
      mkdirSync(emptyDir);

      await expect(getDesignSystemInfo({
        directory: emptyDir
      })).rejects.toThrow();
    });
  });

  describe('Layer 2: get_category_tokens', () => {
    it('should return all tokens in a category', async () => {
      const result = await getCategoryTokens({
        category: 'colors',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.success).toBe(true);
      expect(result.category.name).toBe('colors');
      expect(result.tokens).toHaveLength(5);
      expect(result.tokens.map(t => t.name)).toContain('colors-primary-500');
      expect(result.tokens.map(t => t.name)).toContain('colors-secondary-500');
    });

    it('should include token details and CSS variables', async () => {
      const result = await getCategoryTokens({
        category: 'colors',
        directory: join(TEST_DIR, 'tokens')
      });

      const primaryToken = result.tokens.find(t => t.name === 'colors-primary-500');
      expect(primaryToken).toBeDefined();
      expect(primaryToken!.value).toBe('#3b82f6');
      expect(primaryToken!.type).toBe('color');
      expect(primaryToken!.description).toBe('Primary brand color');
      expect(primaryToken!.cssVariable).toBe('--colors-primary-500');
      expect(primaryToken!.usage).toContain('color properties');
    });

    it('should group tokens by subcategory', async () => {
      const result = await getCategoryTokens({
        category: 'colors',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.subcategories).toBeDefined();
      expect(result.subcategories!.primary).toHaveLength(3); // primary-50, primary-500, primary-900
      expect(result.subcategories!.secondary).toHaveLength(1);
      expect(result.subcategories!.error).toHaveLength(1);
    });

    it('should provide statistics', async () => {
      const result = await getCategoryTokens({
        category: 'colors',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.statistics.totalTokens).toBe(5);
      expect(result.statistics.tokensByType.color).toBe(5);
    });

    it('should handle invalid category', async () => {
      await expect(getCategoryTokens({
        category: 'nonexistent',
        directory: join(TEST_DIR, 'tokens')
      })).rejects.toThrow('Category "nonexistent" not found');
    });

    it('should handle typography tokens', async () => {
      const result = await getCategoryTokens({
        category: 'typography',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.success).toBe(true);
      expect(result.tokens).toHaveLength(3);
      
      const headingToken = result.tokens.find(t => t.name === 'typography-heading-large');
      expect(headingToken).toBeDefined();
      expect(headingToken!.type).toBe('typography');
      expect(headingToken!.value).toHaveProperty('fontFamily');
      expect(headingToken!.value).toHaveProperty('fontSize');
    });

    it('should include resolved values when requested', async () => {
      // Create a file with token references
      const refTokensDir = join(TEST_DIR, 'ref-tokens');
      mkdirSync(refTokensDir, { recursive: true });
      
      writeFileSync(join(refTokensDir, 'colors.json'), JSON.stringify({
        colors: {
          base: { $type: 'color', $value: '#3b82f6' },
          primary: { $type: 'color', $value: '{colors.base}' }
        }
      }));

      const result = await getCategoryTokens({
        category: 'colors',
        directory: refTokensDir,
        includeResolved: true
      });

      const primaryToken = result.tokens.find(t => t.name === 'colors-primary');
      expect(primaryToken).toBeDefined();
      expect(primaryToken!.value).toBe('{colors.base}');
      expect(primaryToken!.resolvedValue).toBe('#3b82f6');
      expect(result.statistics.resolvedTokens).toBe(2);
      expect(result.statistics.unresolvedReferences).toBe(0);
    });

    it('should provide contextual next steps', async () => {
      const result = await getCategoryTokens({
        category: 'typography',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.nextSteps).toHaveLength(5);
      expect(result.nextSteps[0]).toContain('get_token_reference');
      expect(result.nextSteps.some(step => step.includes('typography tokens provide complete text styling'))).toBe(true);
    });
  });

  describe('Layer 3: get_token_reference', () => {
    it('should return comprehensive token details', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.success).toBe(true);
      expect(result.token.name).toBe('colors-primary-500');
      expect(result.token.value).toBe('#3b82f6');
      expect(result.token.category).toBe('colors');
      expect(result.token.isResolved).toBe(true);
    });

    it('should include multiple format variations', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens')
      });

      const token = result.token;
      expect(token.cssVariable).toBe('--colors-primary-500');
      expect(token.cssClass).toBe('.colors-primary-500');
      expect(token.sassVariable).toBe('$colors-primary-500');
      expect(token.lessVariable).toBe('@colors-primary-500');
      expect(token.jsConstant).toBe('COLORS_PRIMARY_500');
    });

    it('should provide code examples', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens'),
        includeExamples: true
      });

      expect(result.token.examples).toHaveLength(3);
      const cssExample = result.token.examples.find(e => e.language === 'css');
      expect(cssExample).toBeDefined();
      expect(cssExample!.code).toContain('var(--colors-primary-500)');
      expect(cssExample!.code).toContain('color:');
      expect(cssExample!.code).toContain('background-color:');
    });

    it('should provide platform usage examples', async () => {
      const result = await getTokenReference({
        category: 'spacing',
        name: 'spacing-md',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.token.platforms).toHaveLength(5);
      const platforms = result.token.platforms.map(p => p.platform);
      expect(platforms).toContain('CSS');
      expect(platforms).toContain('Sass');
      expect(platforms).toContain('JavaScript');
      expect(platforms).toContain('TypeScript');
      expect(platforms).toContain('JSON');
    });

    it('should find related tokens', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens'),
        includeRelated: true
      });

      expect(result.token.relatedTokens.length).toBeGreaterThan(0);
      const relatedNames = result.token.relatedTokens.map(t => t.name);
      expect(relatedNames).toContain('colors-primary-50');
      expect(relatedNames).toContain('colors-primary-900');
      
      const variant = result.token.relatedTokens.find(t => t.name === 'colors-primary-50');
      expect(variant!.relationship).toBe('variant');
    });

    it('should analyze token hierarchy', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.token.tokenHierarchy).toBeDefined();
      expect(result.token.tokenHierarchy!.variants).toContain('colors-primary-50');
      expect(result.token.tokenHierarchy!.variants).toContain('colors-primary-900');
    });

    it('should handle typography tokens with composite values', async () => {
      const result = await getTokenReference({
        category: 'typography',
        name: 'typography-heading-large',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.token.type).toBe('typography');
      expect(result.token.value).toHaveProperty('fontFamily');
      expect(result.token.value).toHaveProperty('fontSize');
      expect(result.token.usage).toContain('Complete typography styling');
      
      const cssExample = result.token.examples.find(e => e.language === 'css');
      expect(cssExample).toBeDefined();
      expect(cssExample!.code).toContain('font-family');
      expect(cssExample!.code).toContain('font-size');
    });

    it('should provide recommendations', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('accessibility'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('CSS custom properties'))).toBe(true);
    });

    it('should handle invalid category', async () => {
      await expect(getTokenReference({
        category: 'nonexistent',
        name: 'any-token',
        directory: join(TEST_DIR, 'tokens')
      })).rejects.toThrow('Category "nonexistent" not found');
    });

    it('should handle invalid token name', async () => {
      await expect(getTokenReference({
        category: 'colors',
        name: 'colors-nonexistent',
        directory: join(TEST_DIR, 'tokens')
      })).rejects.toThrow('Token "colors-nonexistent" not found');
    });

    it('should provide contextual next steps', async () => {
      const result = await getTokenReference({
        category: 'colors',
        name: 'colors-primary-500',
        directory: join(TEST_DIR, 'tokens')
      });

      expect(result.nextSteps.length).toBeGreaterThan(0);
      expect(result.nextSteps[0]).toContain('var(--colors-primary-500)');
      expect(result.nextSteps.some(step => step.includes('get_token_reference'))).toBe(true);
      expect(result.nextSteps.some(step => step.includes('accessibility'))).toBe(true);
    });
  });
});

describe('Validation Functions', () => {
  describe('Layer 1 Validation', () => {
    it('should validate valid arguments', () => {
      expect(() => validateLayer1Args({})).not.toThrow();
      expect(() => validateLayer1Args({ directory: './tokens' })).not.toThrow();
    });

    it('should reject invalid directory paths', () => {
      expect(() => validateLayer1Args({ directory: '../dangerous' })).toThrow(MCPValidationError);
      expect(() => validateLayer1Args({ directory: '' })).toThrow(MCPValidationError);
      expect(() => validateLayer1Args({ directory: 123 })).toThrow(MCPValidationError);
    });
  });

  describe('Layer 2 Validation', () => {
    it('should validate valid arguments', () => {
      expect(() => validateLayer2Args({ category: 'colors' })).not.toThrow();
      expect(() => validateLayer2Args({ 
        category: 'typography', 
        directory: './tokens',
        includeResolved: true
      })).not.toThrow();
    });

    it('should normalize category names', () => {
      const result = validateLayer2Args({ category: 'COLORS' });
      expect(result.category).toBe('colors');
    });

    it('should reject invalid category names', () => {
      expect(() => validateLayer2Args({ category: '' })).toThrow(MCPValidationError);
      expect(() => validateLayer2Args({ category: 'invalid spaces' })).toThrow(MCPValidationError);
      expect(() => validateLayer2Args({ category: 'invalid@chars' })).toThrow(MCPValidationError);
      expect(() => validateLayer2Args({})).toThrow(MCPValidationError);
    });
  });

  describe('Layer 3 Validation', () => {
    it('should validate valid arguments', () => {
      expect(() => validateLayer3Args({ 
        category: 'colors', 
        name: 'colors-primary-500'
      })).not.toThrow();
    });

    it('should reject missing required fields', () => {
      expect(() => validateLayer3Args({ category: 'colors' })).toThrow(MCPValidationError);
      expect(() => validateLayer3Args({ name: 'token-name' })).toThrow(MCPValidationError);
      expect(() => validateLayer3Args({})).toThrow(MCPValidationError);
    });

    it('should validate token name length', () => {
      const longName = 'a'.repeat(201);
      expect(() => validateLayer3Args({ 
        category: 'colors', 
        name: longName 
      })).toThrow(MCPValidationError);
    });
  });

  describe('Category and Token Validation', () => {
    it('should validate existing categories', () => {
      const availableCategories = ['colors', 'typography', 'spacing'];
      
      expect(() => validateCategoryExists('colors', availableCategories)).not.toThrow();
      expect(() => validateCategoryExists('nonexistent', availableCategories)).toThrow(MCPValidationError);
    });

    it('should validate existing tokens', () => {
      const availableTokens = ['colors-primary-500', 'colors-secondary-500'];
      
      expect(() => validateTokenExists('colors-primary-500', 'colors', availableTokens)).not.toThrow();
      expect(() => validateTokenExists('nonexistent', 'colors', availableTokens)).toThrow(MCPValidationError);
    });

    it('should suggest similar token names', () => {
      const availableTokens = ['colors-primary-500', 'colors-secondary-500'];
      
      try {
        validateTokenExists('colors-primari-500', 'colors', availableTokens);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPValidationError);
        expect(error.message).toContain('colors-primary-500');
      }
    });
  });

  describe('Error Message Formatting', () => {
    it('should format validation errors with suggestions', () => {
      try {
        validateLayer2Args({ category: 'invalid spaces' });
      } catch (error) {
        expect(error).toBeInstanceOf(MCPValidationError);
        expect(error.message).toContain('Validation failed');
        expect(error.message).toContain('category:');
        expect(error.message).toContain('💡');
      }
    });

    it('should include allowed values for categories', () => {
      try {
        validateCategoryExists('nonexistent', ['colors', 'typography']);
      } catch (error) {
        expect(error).toBeInstanceOf(MCPValidationError);
        expect(error.message).toContain('🎯 Allowed values: colors, typography');
      }
    });
  });
});

describe('Tool Integration Tests', () => {
  beforeEach(() => {
    // Set up a comprehensive test environment
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
    mkdirSync(TEST_DIR, { recursive: true });
    
    const tokensDir = join(TEST_DIR, 'tokens');
    mkdirSync(tokensDir, { recursive: true });
    
    // Create comprehensive token structure for integration testing
    writeFileSync(join(tokensDir, 'colors-primitives.json'), JSON.stringify({
      colors: {
        blue: {
          50: { $type: 'color', $value: '#eff6ff' },
          500: { $type: 'color', $value: '#3b82f6' },
          900: { $type: 'color', $value: '#1e3a8a' }
        },
        gray: {
          100: { $type: 'color', $value: '#f3f4f6' },
          500: { $type: 'color', $value: '#6b7280' },
          900: { $type: 'color', $value: '#111827' }
        }
      }
    }));

    writeFileSync(join(tokensDir, 'colors-semantic.json'), JSON.stringify({
      colors: {
        primary: { $type: 'color', $value: '{colors.blue.500}' },
        text: { $type: 'color', $value: '{colors.gray.900}' },
        background: { $type: 'color', $value: '{colors.gray.100}' }
      }
    }));
  });

  it('should support the complete three-layer workflow', async () => {
    const directory = join(TEST_DIR, 'tokens');

    // Layer 1: Discovery
    const infoResult = await getDesignSystemInfo({ directory });
    expect(infoResult.success).toBe(true);
    expect(infoResult.categories.length).toBeGreaterThan(0);

    // Layer 2: Understanding
    const categoryResult = await getCategoryTokens({
      category: infoResult.categories[0].name,
      directory,
      includeResolved: true
    });
    expect(categoryResult.success).toBe(true);
    expect(categoryResult.tokens.length).toBeGreaterThan(0);

    // Layer 3: Reference
    const tokenResult = await getTokenReference({
      category: categoryResult.category.name,
      name: categoryResult.tokens[0].name,
      directory
    });
    expect(tokenResult.success).toBe(true);
    expect(tokenResult.token.name).toBe(categoryResult.tokens[0].name);
  });

  it('should handle token references across files', async () => {
    const directory = join(TEST_DIR, 'tokens');

    const categoryResult = await getCategoryTokens({
      category: 'colors',
      directory,
      includeResolved: true
    });

    const primaryToken = categoryResult.tokens.find(t => t.name === 'colors-primary');
    expect(primaryToken).toBeDefined();
    expect(primaryToken!.value).toBe('{colors.blue.500}');
    expect(primaryToken!.resolvedValue).toBe('#3b82f6');
  });

  it('should maintain consistency across layers', async () => {
    const directory = join(TEST_DIR, 'tokens');

    // Get category info from Layer 1
    const infoResult = await getDesignSystemInfo({ directory });
    const colorCategory = infoResult.categories.find(c => c.name === 'colors');
    
    // Get detailed category info from Layer 2
    const categoryResult = await getCategoryTokens({
      category: 'colors',
      directory
    });

    // Verify consistency
    expect(categoryResult.category.name).toBe(colorCategory!.name);
    expect(categoryResult.category.displayName).toBe(colorCategory!.displayName);
    expect(categoryResult.tokens.length).toBe(colorCategory!.tokenCount);
  });
});