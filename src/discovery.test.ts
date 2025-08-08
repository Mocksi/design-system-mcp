import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  TokenFileDiscovery,
  discoverDesignTokens,
  getTokenFilesInDirectory,
  findTokenDirectory,
  getTokenDiscoverySummary,
  getEnvironmentTokenPath,
  setEnvironmentTokenPath,
  isValidTokenDirectory,
  FileErrorHandler,
  FileErrorType,
  discoverDesignTokensWithErrorHandling,
  formatFileErrorReport,
  type TokenFileInfo,
  type TokenDiscoveryResult,
  type FileError,
} from './discovery';
import { writeFileSync, mkdirSync, rmSync, chmodSync, symlinkSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = '/tmp/design-system-mcp-discovery-tests';

describe('Token File Discovery', () => {
  beforeEach(() => {
    // Clean up and create test directory
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.DESIGN_TOKENS_PATH;
  });

  describe('TokenFileDiscovery class', () => {
    it('should discover token files in a directory', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      // Create sample token files
      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({
        colors: { primary: { $type: 'color', $value: '#3b82f6' } }
      }));
      writeFileSync(join(tokenDir, 'spacing.json'), JSON.stringify({
        spacing: { sm: { $type: 'dimension', $value: '8px' } }
      }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(2);
      expect(result.files[0].name).toBe('colors.json');
      expect(result.files[1].name).toBe('spacing.json');
      expect(result.parsedResult.allTokens).toHaveLength(2);
      expect(result.parsedResult.categories).toHaveLength(2);
    });

    it('should handle non-existent directory', () => {
      const nonExistentDir = join(TEST_DIR, 'nonexistent');
      
      const discovery = new TokenFileDiscovery(nonExistentDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(0);
      expect(result.discoveryErrors).toHaveLength(1);
      expect(result.discoveryErrors[0]).toContain('not found');
    });

    it('should ignore non-JSON files', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({ colors: {} }));
      writeFileSync(join(tokenDir, 'README.md'), '# Tokens');
      writeFileSync(join(tokenDir, 'package.json'), JSON.stringify({ name: 'test' }));
      writeFileSync(join(tokenDir, 'data.txt'), 'some data');

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('colors.json');
    });

    it('should ignore hidden files', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({ colors: {} }));
      writeFileSync(join(tokenDir, '.hidden.json'), JSON.stringify({ hidden: {} }));
      writeFileSync(join(tokenDir, '~temp.json'), JSON.stringify({ temp: {} }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('colors.json');
    });

    it('should scan subdirectories', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      const subDir = join(tokenDir, 'components');
      mkdirSync(subDir, { recursive: true });

      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({ colors: {} }));
      writeFileSync(join(subDir, 'buttons.json'), JSON.stringify({ buttons: {} }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(2);
      const fileNames = result.files.map(f => f.name);
      expect(fileNames).toContain('colors.json');
      expect(fileNames).toContain('buttons.json');
    });

    it('should ignore common directories', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      const nodeModules = join(tokenDir, 'node_modules');
      mkdirSync(nodeModules, { recursive: true });

      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({ colors: {} }));
      writeFileSync(join(nodeModules, 'package.json'), JSON.stringify({ name: 'test' }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('colors.json');
    });

    it('should use environment variable for token path', () => {
      const customDir = join(TEST_DIR, 'custom-tokens');
      mkdirSync(customDir);
      writeFileSync(join(customDir, 'tokens.json'), JSON.stringify({ tokens: {} }));

      process.env.DESIGN_TOKENS_PATH = customDir;

      const discovery = new TokenFileDiscovery();
      const result = discovery.discoverTokenFiles();

      expect(result.directory).toBe(customDir);
      expect(result.files).toHaveLength(1);
    });

    it('should collect file metadata', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      const content = JSON.stringify({ colors: { primary: { $type: 'color', $value: '#000' } } });
      writeFileSync(join(tokenDir, 'colors.json'), content);

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('colors.json');
      expect(result.files[0].size).toBeGreaterThan(0);
      expect(result.files[0].lastModified).toBeInstanceOf(Date);
      expect(result.files[0].path).toBe(join(tokenDir, 'colors.json'));
    });
  });

  describe('Multiple files per category', () => {
    it('should handle multiple color files', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      writeFileSync(join(tokenDir, 'colors-primitives.json'), JSON.stringify({
        colors: {
          blue: {
            50: { $type: 'color', $value: '#eff6ff' },
            500: { $type: 'color', $value: '#3b82f6' }
          }
        }
      }));

      writeFileSync(join(tokenDir, 'colors-semantic.json'), JSON.stringify({
        colors: {
          primary: { $type: 'color', $value: '{colors.blue.500}' },
          secondary: { $type: 'color', $value: '#64748b' }
        }
      }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(2);
      expect(result.parsedResult.allTokens).toHaveLength(4);
      
      const colorCategory = result.parsedResult.categories.find(cat => cat.name === 'colors');
      expect(colorCategory?.totalCount).toBe(4);
    });

    it('should merge tokens from multiple files in same category', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      writeFileSync(join(tokenDir, 'typography-fonts.json'), JSON.stringify({
        typography: {
          fonts: {
            sans: { $type: 'fontFamily', $value: ['Inter', 'sans-serif'] },
            mono: { $type: 'fontFamily', $value: ['Roboto Mono', 'monospace'] }
          }
        }
      }));

      writeFileSync(join(tokenDir, 'typography-scales.json'), JSON.stringify({
        typography: {
          sizes: {
            sm: { $type: 'dimension', $value: '14px' },
            lg: { $type: 'dimension', $value: '18px' }
          }
        }
      }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      const typographyCategory = result.parsedResult.categories.find(cat => cat.name === 'typography');
      expect(typographyCategory?.totalCount).toBe(4);
      
      const fontTokens = typographyCategory?.tokens.filter(t => t.path.includes('fonts'));
      const sizeTokens = typographyCategory?.tokens.filter(t => t.path.includes('sizes'));
      
      expect(fontTokens).toHaveLength(2);
      expect(sizeTokens).toHaveLength(2);
    });

    it('should handle mixed organization patterns', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);

      // Single category file
      writeFileSync(join(tokenDir, 'spacing.json'), JSON.stringify({
        spacing: {
          xs: { $type: 'dimension', $value: '4px' },
          sm: { $type: 'dimension', $value: '8px' }
        }
      }));

      // Multiple files for colors
      writeFileSync(join(tokenDir, 'colors-base.json'), JSON.stringify({
        colors: { white: { $type: 'color', $value: '#ffffff' } }
      }));
      writeFileSync(join(tokenDir, 'colors-brand.json'), JSON.stringify({
        colors: { primary: { $type: 'color', $value: '#3b82f6' } }
      }));

      // Nested organization
      const componentsDir = join(tokenDir, 'components');
      mkdirSync(componentsDir);
      writeFileSync(join(componentsDir, 'buttons.json'), JSON.stringify({
        components: {
          button: {
            padding: { $type: 'dimension', $value: '12px' }
          }
        }
      }));

      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(4);
      expect(result.parsedResult.categories).toHaveLength(3);
      
      const colorCategory = result.parsedResult.categories.find(cat => cat.name === 'colors');
      expect(colorCategory?.totalCount).toBe(2);
    });
  });

  describe('Utility functions', () => {
    it('should find token directory', () => {
      const tokenDir = join(TEST_DIR, 'design-system-mcp', 'tokens');
      mkdirSync(tokenDir, { recursive: true });
      writeFileSync(join(tokenDir, 'tokens.json'), JSON.stringify({ tokens: {} }));

      const oldCwd = process.cwd();
      try {
        process.chdir(TEST_DIR);
        const foundDir = findTokenDirectory();
        expect(foundDir).toBe(tokenDir);
      } finally {
        process.chdir(oldCwd);
      }
    });

    it('should return null when no token directory found', () => {
      const oldCwd = process.cwd();
      try {
        process.chdir(TEST_DIR);
        const foundDir = findTokenDirectory();
        expect(foundDir).toBeNull();
      } finally {
        process.chdir(oldCwd);
      }
    });

    it('should validate token directory', () => {
      const validDir = join(TEST_DIR, 'valid');
      mkdirSync(validDir);
      writeFileSync(join(validDir, 'tokens.json'), JSON.stringify({}));

      const invalidDir = join(TEST_DIR, 'invalid');
      mkdirSync(invalidDir);
      // No JSON files

      expect(isValidTokenDirectory(validDir)).toBe(true);
      expect(isValidTokenDirectory(invalidDir)).toBe(false);
      expect(isValidTokenDirectory('/nonexistent')).toBe(false);
    });

    it('should generate discovery summary', () => {
      const result: TokenDiscoveryResult = {
        directory: '/test/dir',
        files: [
          { path: '/test/colors.json', name: 'colors.json', size: 1024, lastModified: new Date() },
          { path: '/test/spacing.json', name: 'spacing.json', size: 512, lastModified: new Date() }
        ],
        parsedResult: {
          categories: [
            { name: 'colors', tokens: [], totalCount: 5 },
            { name: 'spacing', tokens: [], totalCount: 3 }
          ],
          allTokens: [],
          fileCount: 2,
          errors: []
        },
        discoveryErrors: []
      };

      const summary = getTokenDiscoverySummary(result);
      expect(summary).toContain('Found 2 token files');
      expect(summary).toContain('colors.json (1.0KB)');
      expect(summary).toContain('spacing.json (0.5KB)');
      expect(summary).toContain('8 tokens across 2 categories');
    });

    it('should handle environment token path helpers', () => {
      const testPath = '/test/tokens';
      
      setEnvironmentTokenPath(testPath);
      expect(getEnvironmentTokenPath()).toBe(testPath);
      
      delete process.env.DESIGN_TOKENS_PATH;
      expect(getEnvironmentTokenPath()).toBeUndefined();
    });
  });
});

describe('File Error Handling', () => {
  beforeEach(() => {
    try {
      rmSync(TEST_DIR, { recursive: true });
    } catch {}
    mkdirSync(TEST_DIR, { recursive: true });
  });

  describe('FileErrorHandler', () => {
    it('should detect directory not found', () => {
      const errors = FileErrorHandler.analyzeDirectoryError('/nonexistent/directory');
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(FileErrorType.DIRECTORY_NOT_FOUND);
      expect(errors[0].message).toContain('not found');
      expect(errors[0].suggestion).toContain('Create the token directory');
    });

    it('should detect path is not a directory', () => {
      const filePath = join(TEST_DIR, 'not-a-dir');
      writeFileSync(filePath, 'test');

      const errors = FileErrorHandler.analyzeDirectoryError(filePath);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(FileErrorType.DIRECTORY_NOT_ACCESSIBLE);
      expect(errors[0].message).toContain('not a directory');
    });

    it('should detect file not found', () => {
      const error = FileErrorHandler.analyzeFileError('/nonexistent/file.json');
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_NOT_FOUND);
      expect(error!.suggestion).toContain('Check the file path');
    });

    it('should detect empty file', () => {
      const filePath = join(TEST_DIR, 'empty.json');
      writeFileSync(filePath, '');

      const error = FileErrorHandler.analyzeFileError(filePath);
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_EMPTY);
      expect(error!.suggestion).toContain('Add valid W3C Design Token content');
    });

    it('should detect file too small', () => {
      const filePath = join(TEST_DIR, 'tiny.json');
      writeFileSync(filePath, 'x'); // 1 byte

      const error = FileErrorHandler.analyzeFileError(filePath);
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_CORRUPTED);
      expect(error!.message).toContain('too small');
    });

    it('should detect corrupted JSON', () => {
      const filePath = join(TEST_DIR, 'invalid.json');
      writeFileSync(filePath, '{ invalid json }');

      const error = FileErrorHandler.analyzeFileError(filePath);
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_CORRUPTED);
      expect(error!.message).toContain('invalid JSON');
    });

    it('should detect binary/corrupted file', () => {
      const filePath = join(TEST_DIR, 'binary.json');
      writeFileSync(filePath, Buffer.from([0x00, 0x01, 0x02, 0x03]));

      const error = FileErrorHandler.analyzeFileError(filePath);
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_CORRUPTED);
      expect(error!.message).toContain('null bytes');
    });

    it('should detect non-JSON file', () => {
      const filePath = join(TEST_DIR, 'text.json');
      writeFileSync(filePath, 'This is plain text, not JSON');

      const error = FileErrorHandler.analyzeFileError(filePath);
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_CORRUPTED);
      expect(error!.message).toContain('does not appear to be JSON');
    });

    it('should detect directory instead of file', () => {
      const dirPath = join(TEST_DIR, 'directory');
      mkdirSync(dirPath);

      const error = FileErrorHandler.analyzeFileError(dirPath);
      
      expect(error).not.toBeNull();
      expect(error!.type).toBe(FileErrorType.FILE_NOT_ACCESSIBLE);
      expect(error!.message).toContain('found directory');
    });

    it('should handle valid JSON file', () => {
      const filePath = join(TEST_DIR, 'valid.json');
      writeFileSync(filePath, JSON.stringify({ colors: { primary: { $type: 'color', $value: '#000' } } }));

      const error = FileErrorHandler.analyzeFileError(filePath);
      
      expect(error).toBeNull();
    });

    it('should provide common solutions for error types', () => {
      const solutions = FileErrorHandler.getCommonSolutions(FileErrorType.DIRECTORY_NOT_FOUND);
      
      expect(solutions).toHaveLength(3);
      expect(solutions[0]).toContain('mkdir');
      expect(solutions[1]).toContain('DESIGN_TOKENS_PATH');
      expect(solutions[2]).toContain('sample tokens');
    });

    it('should generate helpful error messages', () => {
      const error: FileError = {
        type: FileErrorType.FILE_NOT_FOUND,
        message: 'File not found',
        suggestion: 'Check the path',
        recoveryAction: 'Create the file',
        technicalDetails: 'Path: /test'
      };

      const formatted = FileErrorHandler.generateHelpfulErrorMessage(error);
      
      expect(formatted).toContain('❌ File not found');
      expect(formatted).toContain('💡 Suggestion: Check the path');
      expect(formatted).toContain('🔧 Recovery: Create the file');
      expect(formatted).toContain('🔍 Details: Path: /test');
    });

    it('should diagnose token setup health', () => {
      const tokenDir = join(TEST_DIR, 'tokens');
      mkdirSync(tokenDir);
      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({ colors: {} }));
      writeFileSync(join(tokenDir, 'spacing.json'), JSON.stringify({ spacing: {} }));

      const diagnosis = FileErrorHandler.diagnoseTokenSetup(tokenDir);
      
      expect(diagnosis.isHealthy).toBe(true);
      expect(diagnosis.errors).toHaveLength(0);
      expect(diagnosis.warnings).toHaveLength(0);
    });

    it('should detect unhealthy setup', () => {
      const tokenDir = join(TEST_DIR, 'empty-tokens');
      mkdirSync(tokenDir);
      // No token files

      const diagnosis = FileErrorHandler.diagnoseTokenSetup(tokenDir);
      
      expect(diagnosis.isHealthy).toBe(false);
      expect(diagnosis.errors).toHaveLength(1);
      expect(diagnosis.errors[0].type).toBe(FileErrorType.NO_TOKEN_FILES);
    });

    it('should provide warnings for single file setup', () => {
      const tokenDir = join(TEST_DIR, 'single-file');
      mkdirSync(tokenDir);
      writeFileSync(join(tokenDir, 'all-tokens.json'), JSON.stringify({ colors: {}, spacing: {} }));

      const diagnosis = FileErrorHandler.diagnoseTokenSetup(tokenDir);
      
      expect(diagnosis.isHealthy).toBe(true);
      expect(diagnosis.warnings).toHaveLength(1);
      expect(diagnosis.warnings[0]).toContain('Only one token file');
      expect(diagnosis.recommendations).toHaveLength(1);
      expect(diagnosis.recommendations[0]).toContain('separate files');
    });

    // Skip permission tests on systems that might not support them
    const canTestPermissions = process.platform !== 'win32';
    
    (canTestPermissions ? it : it.skip)('should detect permission issues', () => {
      const tokenDir = join(TEST_DIR, 'no-perms');
      mkdirSync(tokenDir);
      
      try {
        chmodSync(tokenDir, 0o000); // Remove all permissions
        
        const errors = FileErrorHandler.analyzeDirectoryError(tokenDir);
        
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.type === FileErrorType.INVALID_PERMISSIONS)).toBe(true);
      } finally {
        chmodSync(tokenDir, 0o755); // Restore permissions for cleanup
      }
    });
  });

  describe('Enhanced discovery with error handling', () => {
    it('should provide comprehensive error analysis', () => {
      const nonExistentDir = join(TEST_DIR, 'nonexistent');
      
      const { result, fileErrors, healthCheck } = discoverDesignTokensWithErrorHandling(nonExistentDir);
      
      expect(result.files).toHaveLength(0);
      expect(result.discoveryErrors).toHaveLength(1);
      expect(fileErrors).toHaveLength(1);
      expect(healthCheck.isHealthy).toBe(false);
      expect(healthCheck.errors).toHaveLength(1);
    });

    it('should analyze healthy setup', () => {
      const tokenDir = join(TEST_DIR, 'healthy');
      mkdirSync(tokenDir);
      writeFileSync(join(tokenDir, 'colors.json'), JSON.stringify({
        colors: { primary: { $type: 'color', $value: '#000' } }
      }));

      const { result, fileErrors, healthCheck } = discoverDesignTokensWithErrorHandling(tokenDir);
      
      expect(result.files).toHaveLength(1);
      expect(result.discoveryErrors).toHaveLength(0);
      expect(fileErrors).toHaveLength(0);
      expect(healthCheck.isHealthy).toBe(true);
    });
  });

  describe('Error formatting', () => {
    it('should format file error reports', () => {
      const errors: FileError[] = [
        {
          type: FileErrorType.FILE_NOT_FOUND,
          message: 'File missing',
          filePath: 'test.json',
          suggestion: 'Create the file'
        },
        {
          type: FileErrorType.DIRECTORY_NOT_FOUND,
          message: 'Directory missing',
          filePath: '/tokens',
          recoveryAction: 'mkdir /tokens'
        }
      ];

      const formatted = formatFileErrorReport(errors);
      
      expect(formatted).toContain('🚨 Found 2 file errors');
      expect(formatted).toContain('📋 file not found');
      expect(formatted).toContain('📋 directory not found');
      expect(formatted).toContain('❌ File missing');
      expect(formatted).toContain('💡 Suggestion: Create the file');
      expect(formatted).toContain('🔧 Recovery: mkdir /tokens');
      expect(formatted).toContain('📚 Common solutions:');
    });

    it('should handle no errors', () => {
      const formatted = formatFileErrorReport([]);
      expect(formatted).toBe('✅ No file errors detected');
    });
  });

  describe('Edge cases and stress testing', () => {
    it('should handle very large number of files', () => {
      const tokenDir = join(TEST_DIR, 'many-files');
      mkdirSync(tokenDir);

      // Create 25 files to trigger warning
      for (let i = 1; i <= 25; i++) {
        writeFileSync(join(tokenDir, `tokens-${i}.json`), JSON.stringify({
          [`category${i}`]: { token: { $type: 'color', $value: '#000' } }
        }));
      }

      const diagnosis = FileErrorHandler.diagnoseTokenSetup(tokenDir);
      
      expect(diagnosis.warnings.some(w => w.includes('Large number of token files'))).toBe(true);
    });

    it('should handle mixed file types gracefully', () => {
      const tokenDir = join(TEST_DIR, 'mixed');
      mkdirSync(tokenDir);

      writeFileSync(join(tokenDir, 'valid.json'), JSON.stringify({ colors: {} }));
      writeFileSync(join(tokenDir, 'empty.json'), '');
      writeFileSync(join(tokenDir, 'invalid.json'), '{ broken json }');
      writeFileSync(join(tokenDir, 'readme.txt'), 'Not a token file');
      
      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      // Should find 3 JSON files, but only 1 should parse successfully
      expect(result.files).toHaveLength(3);
      expect(result.parsedResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle deeply nested directory structure', () => {
      const deepDir = join(TEST_DIR, 'deep', 'nested', 'structure', 'tokens');
      mkdirSync(deepDir, { recursive: true });
      
      writeFileSync(join(deepDir, 'colors.json'), JSON.stringify({ colors: {} }));

      const discovery = new TokenFileDiscovery(deepDir);
      const result = discovery.discoverTokenFiles();

      expect(result.files).toHaveLength(1);
      expect(result.parsedResult.allTokens).toHaveLength(0); // Empty colors object
    });
  });
});