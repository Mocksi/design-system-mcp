import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateDesignTokensFile,
  TokenFileParser,
  parseMultipleTokenFiles,
  categorizeTokens,
  inferTokenCategory,
  getCategoryInfo,
  getCategorySummary,
  TokenReferenceResolver,
  resolveTokenReferences,
  getUnresolvedTokens,
  getCircularReferences,
  TokenFileValidator,
  TokenErrorType,
  validateTokenFiles,
  formatTokenErrors,
  getValidationSummary,
  isToken,
  isTokenGroup,
  isTokenReference,
  KNOWN_CATEGORIES,
  type ParsedToken,
  type ResolvedToken,
  type TokenError,
} from './w3c-tokens';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = '/tmp/design-system-mcp-tests';

describe('W3C Design Token Validation', () => {
  it('should validate a simple color token', () => {
    const validToken = {
      colors: {
        primary: {
          $type: 'color',
          $value: '#3b82f6',
          $description: 'Primary brand color',
        },
      },
    };

    expect(() => validateDesignTokensFile(validToken)).not.toThrow();
  });

  it('should validate typography token', () => {
    const validToken = {
      typography: {
        heading: {
          $type: 'typography',
          $value: {
            fontFamily: 'Inter',
            fontSize: '24px',
            fontWeight: 600,
            lineHeight: '1.2',
          },
        },
      },
    };

    expect(() => validateDesignTokensFile(validToken)).not.toThrow();
  });

  it('should validate border token', () => {
    const validToken = {
      borders: {
        thin: {
          $type: 'border',
          $value: {
            color: '#000000',
            width: '1px',
            style: 'solid',
          },
        },
      },
    };

    expect(() => validateDesignTokensFile(validToken)).not.toThrow();
  });

  it('should validate shadow token', () => {
    const validToken = {
      shadows: {
        elevation: {
          $type: 'shadow',
          $value: {
            color: '#000000',
            offsetX: '0px',
            offsetY: '2px',
            blur: '4px',
            spread: '0px',
          },
        },
      },
    };

    expect(() => validateDesignTokensFile(validToken)).not.toThrow();
  });

  it('should validate token reference', () => {
    const validToken = {
      colors: {
        primary: {
          $type: 'color',
          $value: '#3b82f6',
        },
        accent: {
          $type: 'color',
          $value: '{colors.primary}',
        },
      },
    };

    expect(() => validateDesignTokensFile(validToken)).not.toThrow();
  });

  it('should reject invalid token structure', () => {
    const invalidToken = {
      colors: {
        primary: {
          // Missing $value
          $type: 'color',
        },
      },
    };

    expect(() => validateDesignTokensFile(invalidToken)).toThrow();
  });

  it('should reject invalid color value', () => {
    const invalidToken = {
      colors: {
        primary: {
          $type: 'color',
          $value: 123, // Should be string
        },
      },
    };

    expect(() => validateDesignTokensFile(invalidToken)).toThrow();
  });
});

describe('Token Type Guards', () => {
  it('should identify valid tokens', () => {
    const token = {
      $type: 'color',
      $value: '#3b82f6',
    };

    expect(isToken(token)).toBe(true);
  });

  it('should identify token groups', () => {
    const group = {
      primary: {
        $type: 'color',
        $value: '#3b82f6',
      },
      secondary: {
        $type: 'color',
        $value: '#64748b',
      },
    };

    expect(isTokenGroup(group)).toBe(true);
  });

  it('should identify token references', () => {
    const reference = {
      $value: '{colors.primary}',
    };

    expect(isTokenReference(reference)).toBe(true);
  });

  it('should reject invalid token references', () => {
    const invalidRef1 = { $value: 'colors.primary' }; // Missing braces
    const invalidRef2 = { $value: '{colors.primary' }; // Missing closing brace
    const invalidRef3 = { $value: 'colors.primary}' }; // Missing opening brace

    expect(isTokenReference(invalidRef1)).toBe(false);
    expect(isTokenReference(invalidRef2)).toBe(false);
    expect(isTokenReference(invalidRef3)).toBe(false);
  });
});

describe('Token File Parser', () => {
  beforeEach(() => {
    // Clean up and create test directory
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('should parse a single token file', () => {
    const tokenData = {
      colors: {
        primary: {
          $type: 'color',
          $value: '#3b82f6',
          $description: 'Primary brand color',
        },
        secondary: {
          $type: 'color',
          $value: '#64748b',
        },
      },
    };

    const filePath = join(TEST_DIR, 'colors.json');
    writeFileSync(filePath, JSON.stringify(tokenData, null, 2));

    const parser = new TokenFileParser();
    parser.parseTokenFile(filePath);
    const result = parser.getResults();

    expect(result.allTokens).toHaveLength(2);
    expect(result.allTokens[0].name).toBe('colors-primary');
    expect(result.allTokens[0].value).toBe('#3b82f6');
    expect(result.allTokens[0].description).toBe('Primary brand color');
    expect(result.allTokens[1].name).toBe('colors-secondary');
  });

  it('should parse multiple token files', () => {
    const colorsData = {
      colors: {
        primary: { $type: 'color', $value: '#3b82f6' },
      },
    };

    const spacingData = {
      spacing: {
        small: { $type: 'dimension', $value: '8px' },
        medium: { $type: 'dimension', $value: '16px' },
      },
    };

    const colorsFile = join(TEST_DIR, 'colors.json');
    const spacingFile = join(TEST_DIR, 'spacing.json');

    writeFileSync(colorsFile, JSON.stringify(colorsData, null, 2));
    writeFileSync(spacingFile, JSON.stringify(spacingData, null, 2));

    const result = parseMultipleTokenFiles([colorsFile, spacingFile]);

    expect(result.allTokens).toHaveLength(3);
    expect(result.fileCount).toBe(2);
    expect(result.categories).toHaveLength(2);
    
    const colorCategory = result.categories.find(cat => cat.name === 'colors');
    const spacingCategory = result.categories.find(cat => cat.name === 'spacing');
    
    expect(colorCategory?.totalCount).toBe(1);
    expect(spacingCategory?.totalCount).toBe(2);
  });

  it('should handle nested token groups', () => {
    const tokenData = {
      colors: {
        primary: {
          50: { $type: 'color', $value: '#eff6ff' },
          500: { $type: 'color', $value: '#3b82f6' },
          900: { $type: 'color', $value: '#1e3a8a' },
        },
      },
    };

    const filePath = join(TEST_DIR, 'nested.json');
    writeFileSync(filePath, JSON.stringify(tokenData, null, 2));

    const parser = new TokenFileParser();
    parser.parseTokenFile(filePath);
    const result = parser.getResults();

    expect(result.allTokens).toHaveLength(3);
    expect(result.allTokens[0].name).toBe('colors-primary-50');
    expect(result.allTokens[1].name).toBe('colors-primary-500');
    expect(result.allTokens[2].name).toBe('colors-primary-900');
  });

  it('should handle parsing errors gracefully', () => {
    const filePath = join(TEST_DIR, 'invalid.json');
    writeFileSync(filePath, '{ invalid json }');

    const parser = new TokenFileParser();
    parser.parseTokenFile(filePath);
    const result = parser.getResults();

    expect(result.allTokens).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Invalid JSON format');
  });
});

describe('Token Categorization', () => {
  it('should categorize tokens correctly', () => {
    const tokens: ParsedToken[] = [
      {
        name: 'colors-primary',
        path: ['colors', 'primary'],
        value: '#3b82f6',
        type: 'color',
      },
      {
        name: 'spacing-small',
        path: ['spacing', 'small'],
        value: '8px',
        type: 'dimension',
      },
      {
        name: 'typography-heading',
        path: ['typography', 'heading'],
        value: { fontFamily: 'Inter', fontSize: '24px' },
        type: 'typography',
      },
    ];

    const categories = categorizeTokens(tokens);

    expect(categories).toHaveLength(3);
    expect(categories[0].name).toBe('colors');
    expect(categories[1].name).toBe('typography');
    expect(categories[2].name).toBe('spacing');
  });

  it('should infer category from token type', () => {
    const colorToken: ParsedToken = {
      name: 'brand-primary',
      path: ['brand', 'primary'],
      value: '#3b82f6',
      type: 'color',
    };

    expect(inferTokenCategory(colorToken)).toBe('colors');
  });

  it('should infer spacing category from token name', () => {
    const spacingToken: ParsedToken = {
      name: 'margin-lg',
      path: ['margin', 'lg'],
      value: '24px',
      type: 'dimension',
    };

    expect(inferTokenCategory(spacingToken)).toBe('spacing');
  });

  it('should get category info', () => {
    const colorInfo = getCategoryInfo('colors');
    expect(colorInfo.displayName).toBe('Colors');
    expect(colorInfo.icon).toBe('🎨');
    expect(colorInfo.expectedTypes).toContain('color');
  });

  it('should generate category summary', () => {
    const categories = [
      { name: 'colors', tokens: [], totalCount: 5 },
      { name: 'spacing', tokens: [], totalCount: 3 },
    ];

    const summary = getCategorySummary(categories);
    expect(summary).toContain('2 categories');
    expect(summary).toContain('8 total tokens');
    expect(summary).toContain('🎨 Colors (5 tokens)');
    expect(summary).toContain('📏 Spacing (3 tokens)');
  });
});

describe('Token Reference Resolution', () => {
  it('should resolve simple token references', () => {
    const tokens: ParsedToken[] = [
      {
        name: 'colors-primary',
        path: ['colors', 'primary'],
        value: '#3b82f6',
        type: 'color',
      },
      {
        name: 'colors-accent',
        path: ['colors', 'accent'],
        value: '{colors.primary}',
        type: 'color',
      },
    ];

    const resolved = resolveTokenReferences(tokens);
    
    expect(resolved).toHaveLength(2);
    
    const accentToken = resolved.find(t => t.name === 'colors-accent')!;
    expect(accentToken.isResolved).toBe(true);
    expect(accentToken.resolvedValue).toBe('#3b82f6');
    expect(accentToken.referencePath).toBe('colors.primary');
  });

  it('should detect circular references', () => {
    const tokens: ParsedToken[] = [
      {
        name: 'colors-a',
        path: ['colors', 'a'],
        value: '{colors.b}',
        type: 'color',
      },
      {
        name: 'colors-b',
        path: ['colors', 'b'],
        value: '{colors.a}',
        type: 'color',
      },
    ];

    const resolved = resolveTokenReferences(tokens);
    const circularRefs = getCircularReferences(resolved);
    
    expect(circularRefs).toHaveLength(2);
    expect(circularRefs[0].hasCircularReference).toBe(true);
    expect(circularRefs[0].resolutionError).toContain('Circular reference');
  });

  it('should handle unresolved references', () => {
    const tokens: ParsedToken[] = [
      {
        name: 'colors-accent',
        path: ['colors', 'accent'],
        value: '{colors.nonexistent}',
        type: 'color',
      },
    ];

    const resolved = resolveTokenReferences(tokens);
    const unresolved = getUnresolvedTokens(resolved);
    
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].isResolved).toBe(false);
    expect(unresolved[0].resolutionError).toContain('Referenced token not found');
  });

  it('should resolve references in composite tokens', () => {
    const tokens: ParsedToken[] = [
      {
        name: 'colors-primary',
        path: ['colors', 'primary'],
        value: '#3b82f6',
        type: 'color',
      },
      {
        name: 'borders-primary',
        path: ['borders', 'primary'],
        value: {
          color: '{colors.primary}',
          width: '1px',
          style: 'solid',
        },
        type: 'border',
      },
    ];

    const resolved = resolveTokenReferences(tokens);
    const borderToken = resolved.find(t => t.name === 'borders-primary')!;
    
    expect(borderToken.isResolved).toBe(true);
    expect(borderToken.resolvedValue.color).toBe('#3b82f6');
    expect(borderToken.resolvedValue.width).toBe('1px');
  });

  it('should handle different reference formats', () => {
    const tokens: ParsedToken[] = [
      {
        name: 'colors-primary-500',
        path: ['colors', 'primary', '500'],
        value: '#3b82f6',
        type: 'color',
      },
      {
        name: 'colors-accent',
        path: ['colors', 'accent'],
        value: '{colors.primary.500}',
        type: 'color',
      },
    ];

    const resolver = new TokenReferenceResolver(tokens);
    const resolved = resolver.resolveToken('colors-accent')!;
    
    expect(resolved.isResolved).toBe(true);
    expect(resolved.resolvedValue).toBe('#3b82f6');
  });
});

describe('Token File Validation', () => {
  beforeEach(() => {
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
    mkdirSync(TEST_DIR, { recursive: true });
  });

  it('should validate correct token files', () => {
    const validData = {
      colors: {
        primary: {
          $type: 'color',
          $value: '#3b82f6',
        },
      },
    };

    const filePath = join(TEST_DIR, 'valid.json');
    writeFileSync(filePath, JSON.stringify(validData, null, 2));

    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile(filePath);

    expect(errors).toHaveLength(0);
  });

  it('should detect missing files', () => {
    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile('/nonexistent/file.json');

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(TokenErrorType.FILE_NOT_FOUND);
    expect(errors[0].suggestion).toContain('Check that the file path is correct');
  });

  it('should detect invalid JSON', () => {
    const filePath = join(TEST_DIR, 'invalid.json');
    writeFileSync(filePath, '{ "invalid": json }');

    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile(filePath);

    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe(TokenErrorType.INVALID_JSON);
    expect(errors[0].suggestion).toContain('missing commas');
  });

  it('should detect missing $value property', () => {
    const invalidData = {
      colors: {
        primary: {
          $type: 'color',
          // Missing $value
        },
      },
    };

    const filePath = join(TEST_DIR, 'missing-value.json');
    writeFileSync(filePath, JSON.stringify(invalidData, null, 2));

    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile(filePath);

    expect(errors.length).toBeGreaterThan(0);
    const missingValueError = errors.find(e => e.type === TokenErrorType.MISSING_VALUE);
    expect(missingValueError).toBeDefined();
    expect(missingValueError?.suggestion).toContain('Add a "$value" property');
  });

  it('should validate typography tokens', () => {
    const invalidTypography = {
      typography: {
        heading: {
          $type: 'typography',
          $value: {
            // Missing required fontFamily and fontSize
            fontWeight: 600,
          },
        },
      },
    };

    const filePath = join(TEST_DIR, 'invalid-typography.json');
    writeFileSync(filePath, JSON.stringify(invalidTypography, null, 2));

    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile(filePath);

    expect(errors.length).toBeGreaterThan(0);
    
    const fontFamilyError = errors.find(e => 
      e.message.includes('fontFamily') && e.type === TokenErrorType.MISSING_VALUE
    );
    const fontSizeError = errors.find(e => 
      e.message.includes('fontSize') && e.type === TokenErrorType.MISSING_VALUE
    );
    
    expect(fontFamilyError).toBeDefined();
    expect(fontSizeError).toBeDefined();
  });

  it('should validate border tokens', () => {
    const invalidBorder = {
      borders: {
        primary: {
          $type: 'border',
          $value: {
            color: '#000000',
            // Missing required width and style
          },
        },
      },
    };

    const filePath = join(TEST_DIR, 'invalid-border.json');
    writeFileSync(filePath, JSON.stringify(invalidBorder, null, 2));

    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile(filePath);

    expect(errors.length).toBeGreaterThan(0);
    
    const widthError = errors.find(e => e.message.includes('width'));
    const styleError = errors.find(e => e.message.includes('style'));
    
    expect(widthError).toBeDefined();
    expect(styleError).toBeDefined();
  });

  it('should validate shadow tokens', () => {
    const invalidShadow = {
      shadows: {
        elevation: {
          $type: 'shadow',
          $value: {
            color: '#000000',
            offsetX: '0px',
            // Missing required offsetY and blur
          },
        },
      },
    };

    const filePath = join(TEST_DIR, 'invalid-shadow.json');
    writeFileSync(filePath, JSON.stringify(invalidShadow, null, 2));

    const validator = new TokenFileValidator();
    const errors = validator.validateTokenFile(filePath);

    expect(errors.length).toBeGreaterThan(0);
    
    const offsetYError = errors.find(e => e.message.includes('offsetY'));
    const blurError = errors.find(e => e.message.includes('blur'));
    
    expect(offsetYError).toBeDefined();
    expect(blurError).toBeDefined();
  });

  it('should validate token references', () => {
    const invalidReference = {
      colors: {
        primary: {
          $type: 'color',
          $value: 'colors.base', // Invalid format, should be {colors.base}
        },
      },
    };

    const filePath = join(TEST_DIR, 'invalid-reference.json');
    writeFileSync(filePath, JSON.stringify(invalidReference, null, 2));

    const errors = validateTokenFiles([filePath]);
    
    // Should pass basic validation since it's a valid string value
    // But semantic validation might catch this as an invalid color format
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('Error Formatting', () => {
  it('should format errors nicely', () => {
    const errors: TokenError[] = [
      {
        type: TokenErrorType.MISSING_VALUE,
        message: 'colors.json at "primary": Token missing required "$value" property',
        file: 'colors.json',
        tokenPath: ['colors', 'primary'],
        suggestion: 'Add a "$value" property with the token\'s value',
      },
      {
        type: TokenErrorType.INVALID_JSON,
        message: 'spacing.json: Invalid JSON format - Unexpected token',
        file: 'spacing.json',
        line: 5,
        column: 10,
        suggestion: 'Check for missing commas, quotes, or brackets',
      },
    ];

    const formatted = formatTokenErrors(errors);
    
    expect(formatted).toContain('📄 colors.json');
    expect(formatted).toContain('📄 spacing.json');
    expect(formatted).toContain('❌');
    expect(formatted).toContain('💡 Suggestion:');
    expect(formatted).toContain('line 5, column 10');
  });

  it('should generate validation summary', () => {
    const errors: TokenError[] = [
      { type: TokenErrorType.MISSING_VALUE, message: 'Missing value', file: 'test.json' },
      { type: TokenErrorType.MISSING_VALUE, message: 'Missing value 2', file: 'test.json' },
      { type: TokenErrorType.INVALID_JSON, message: 'Invalid JSON', file: 'test.json' },
    ];

    const summary = getValidationSummary(errors);
    
    expect(summary).toContain('❌ Found 3 validation errors');
    expect(summary).toContain('2 missing value');
    expect(summary).toContain('1 invalid json');
  });

  it('should handle no errors', () => {
    const summary = getValidationSummary([]);
    expect(summary).toBe('✅ All token files are valid');
  });
});

describe('Known Categories', () => {
  it('should have all expected categories defined', () => {
    const expectedCategories = [
      'colors',
      'typography',
      'spacing',
      'borders',
      'shadows',
      'animations',
      'components',
    ];

    for (const category of expectedCategories) {
      expect(KNOWN_CATEGORIES[category]).toBeDefined();
      expect(KNOWN_CATEGORIES[category].displayName).toBeDefined();
      expect(KNOWN_CATEGORIES[category].description).toBeDefined();
      expect(KNOWN_CATEGORIES[category].expectedTypes).toBeDefined();
    }
  });

  it('should have icons for visual categories', () => {
    expect(KNOWN_CATEGORIES.colors.icon).toBe('🎨');
    expect(KNOWN_CATEGORIES.typography.icon).toBe('📝');
    expect(KNOWN_CATEGORIES.spacing.icon).toBe('📏');
    expect(KNOWN_CATEGORIES.shadows.icon).toBe('🌑');
  });
});