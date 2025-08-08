import { readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, extname } from 'path';
import { parseMultipleTokenFiles, type ParsedTokensResult } from './parsers/w3c-tokens.js';

export interface TokenFileInfo {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
}

export interface TokenDiscoveryResult {
  directory: string;
  files: TokenFileInfo[];
  parsedResult: ParsedTokensResult;
  discoveryErrors: string[];
}

export class TokenFileDiscovery {
  private defaultTokensPath = './design-system-mcp/tokens';
  
  constructor(private tokenDirectory?: string) {
    this.tokenDirectory = tokenDirectory || this.getTokenDirectory();
  }

  private getTokenDirectory(): string {
    // Check environment variable first
    if (process.env.DESIGN_TOKENS_PATH) {
      return resolve(process.env.DESIGN_TOKENS_PATH);
    }

    // Try common token directory locations
    const commonPaths = [
      './design-system-mcp/tokens',
      './tokens',
      './design-tokens',
      './src/tokens',
    ];

    for (const path of commonPaths) {
      const fullPath = resolve(path);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }

    // Default to the expected location
    return resolve(this.defaultTokensPath);
  }

  discoverTokenFiles(): TokenDiscoveryResult {
    const discoveryErrors: string[] = [];
    const directory = this.tokenDirectory!;
    
    // Check if directory exists
    if (!existsSync(directory)) {
      discoveryErrors.push(
        `Token directory not found: ${directory}. ` +
        `Set DESIGN_TOKENS_PATH environment variable or create the directory.`
      );
      
      return {
        directory,
        files: [],
        parsedResult: {
          categories: [],
          allTokens: [],
          fileCount: 0,
          errors: discoveryErrors,
        },
        discoveryErrors,
      };
    }

    // Check if it's actually a directory
    try {
      const stat = statSync(directory);
      if (!stat.isDirectory()) {
        discoveryErrors.push(`Token path is not a directory: ${directory}`);
        return {
          directory,
          files: [],
          parsedResult: {
            categories: [],
            allTokens: [],
            fileCount: 0,
            errors: discoveryErrors,
          },
          discoveryErrors,
        };
      }
    } catch (error) {
      discoveryErrors.push(`Cannot access token directory: ${directory} - ${error}`);
      return {
        directory,
        files: [],
        parsedResult: {
          categories: [],
          allTokens: [],
          fileCount: 0,
          errors: discoveryErrors,
        },
        discoveryErrors,
      };
    }

    // Scan for JSON files
    const files = this.scanTokenFiles(directory, discoveryErrors);
    
    if (files.length === 0) {
      discoveryErrors.push(
        `No token files found in ${directory}. ` +
        `Add .json files containing W3C Design Tokens to get started.`
      );
    }

    // Parse all discovered files
    const filePaths = files.map(f => f.path);
    const parsedResult = parseMultipleTokenFiles(filePaths);
    
    // Merge discovery errors with parsing errors
    parsedResult.errors = [...discoveryErrors, ...parsedResult.errors];

    return {
      directory,
      files,
      parsedResult,
      discoveryErrors,
    };
  }

  private scanTokenFiles(directory: string, errors: string[]): TokenFileInfo[] {
    const files: TokenFileInfo[] = [];
    
    try {
      const entries = readdirSync(directory);
      
      for (const entry of entries) {
        const fullPath = join(directory, entry);
        
        try {
          const stat = statSync(fullPath);
          
          if (stat.isFile() && this.isTokenFile(entry)) {
            files.push({
              path: fullPath,
              name: entry,
              size: stat.size,
              lastModified: stat.mtime,
            });
          } else if (stat.isDirectory() && this.shouldScanSubdirectory(entry)) {
            // Recursively scan subdirectories for token files
            const subFiles = this.scanTokenFiles(fullPath, errors);
            files.push(...subFiles);
          }
        } catch (error) {
          errors.push(`Cannot access file ${fullPath}: ${error}`);
        }
      }
    } catch (error) {
      errors.push(`Cannot read directory ${directory}: ${error}`);
    }
    
    // Sort files by name for consistent ordering
    return files.sort((a, b) => a.name.localeCompare(b.name));
  }

  private isTokenFile(filename: string): boolean {
    // Must be a JSON file
    if (extname(filename).toLowerCase() !== '.json') {
      return false;
    }

    // Ignore common non-token JSON files
    const ignoredFiles = [
      'package.json',
      'tsconfig.json',
      '.eslintrc.json',
      'package-lock.json',
    ];

    if (ignoredFiles.includes(filename.toLowerCase())) {
      return false;
    }

    // Ignore hidden files and temporary files
    if (filename.startsWith('.') || filename.startsWith('~') || filename.endsWith('.tmp')) {
      return false;
    }

    return true;
  }

  private shouldScanSubdirectory(dirname: string): boolean {
    // Ignore common directories that shouldn't contain tokens
    const ignoredDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
    ];

    if (ignoredDirs.includes(dirname.toLowerCase())) {
      return false;
    }

    // Ignore hidden directories
    if (dirname.startsWith('.')) {
      return false;
    }

    return true;
  }

  // Static utility methods
  static getRecommendedTokenDirectory(): string {
    return resolve('./design-system-mcp/tokens');
  }

  static createTokenDirectoryStructure(baseDir?: string): string[] {
    const tokenDir = baseDir || TokenFileDiscovery.getRecommendedTokenDirectory();
    
    // Common token file organization
    const recommendedFiles = [
      'colors-primitives.json',
      'colors-semantic.json', 
      'typography.json',
      'spacing.json',
      'borders.json',
      'shadows.json',
      'components.json',
    ];

    return recommendedFiles.map(filename => join(tokenDir, filename));
  }

  static validateTokenDirectory(directory: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!existsSync(directory)) {
      return {
        isValid: false,
        issues: [`Directory does not exist: ${directory}`],
      };
    }

    try {
      const stat = statSync(directory);
      if (!stat.isDirectory()) {
        issues.push(`Path is not a directory: ${directory}`);
      }
    } catch (error) {
      issues.push(`Cannot access directory: ${error}`);
    }

    // Check for JSON files
    try {
      const entries = readdirSync(directory);
      const jsonFiles = entries.filter(entry => 
        entry.toLowerCase().endsWith('.json') && 
        !entry.startsWith('.') &&
        entry !== 'package.json'
      );

      if (jsonFiles.length === 0) {
        issues.push('No JSON files found in token directory');
      }
    } catch (error) {
      issues.push(`Cannot read directory contents: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

// Utility functions for token discovery
export function discoverDesignTokens(directory?: string): TokenDiscoveryResult {
  const discovery = new TokenFileDiscovery(directory);
  return discovery.discoverTokenFiles();
}

export function getTokenFilesInDirectory(directory: string): TokenFileInfo[] {
  const discovery = new TokenFileDiscovery(directory);
  const result = discovery.discoverTokenFiles();
  return result.files;
}

export function findTokenDirectory(): string | null {
  const discovery = new TokenFileDiscovery();
  const result = discovery.discoverTokenFiles();
  
  if (result.files.length > 0) {
    return result.directory;
  }
  
  return null;
}

export function getTokenDiscoverySummary(result: TokenDiscoveryResult): string {
  const { directory, files, parsedResult, discoveryErrors } = result;
  
  if (discoveryErrors.length > 0) {
    return `❌ Token discovery failed:\n${discoveryErrors.map(err => `  • ${err}`).join('\n')}`;
  }

  if (files.length === 0) {
    return `📁 No token files found in ${directory}`;
  }

  const fileList = files.map(f => `  📄 ${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join('\n');
  const categoryCount = parsedResult.categories.length;
  const tokenCount = parsedResult.allTokens.length;
  const errorCount = parsedResult.errors.length;

  let summary = `📁 Found ${files.length} token files in ${directory}:\n${fileList}\n\n`;
  
  if (tokenCount > 0) {
    summary += `✅ Parsed ${tokenCount} tokens across ${categoryCount} categories`;
    if (errorCount > 0) {
      summary += `\n⚠️  ${errorCount} parsing errors detected`;
    }
  } else {
    summary += `❌ No valid tokens found`;
  }

  return summary;
}

// Environment helpers
export function getEnvironmentTokenPath(): string | undefined {
  return process.env.DESIGN_TOKENS_PATH;
}

export function setEnvironmentTokenPath(path: string): void {
  process.env.DESIGN_TOKENS_PATH = resolve(path);
}

// File system utilities for token management
export function getTokenFileStats(filePath: string): TokenFileInfo | null {
  try {
    const stat = statSync(filePath);
    return {
      path: filePath,
      name: filePath.split('/').pop() || filePath,
      size: stat.size,
      lastModified: stat.mtime,
    };
  } catch {
    return null;
  }
}

export function isValidTokenDirectory(directory: string): boolean {
  const validation = TokenFileDiscovery.validateTokenDirectory(directory);
  return validation.isValid;
}

// Enhanced error handling for missing/corrupted files
export enum FileErrorType {
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  DIRECTORY_NOT_ACCESSIBLE = 'DIRECTORY_NOT_ACCESSIBLE', 
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_NOT_ACCESSIBLE = 'FILE_NOT_ACCESSIBLE',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  FILE_EMPTY = 'FILE_EMPTY',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_PERMISSIONS = 'INVALID_PERMISSIONS',
  NO_TOKEN_FILES = 'NO_TOKEN_FILES',
  SYMLINK_BROKEN = 'SYMLINK_BROKEN',
}

export interface FileError {
  type: FileErrorType;
  message: string;
  filePath?: string;
  suggestion?: string;
  recoveryAction?: string;
  technicalDetails?: string;
}

export class FileErrorHandler {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MIN_FILE_SIZE = 2; // 2 bytes minimum for "{}"

  static analyzeDirectoryError(directory: string): FileError[] {
    const errors: FileError[] = [];

    if (!existsSync(directory)) {
      errors.push({
        type: FileErrorType.DIRECTORY_NOT_FOUND,
        message: `Token directory not found: ${directory}`,
        filePath: directory,
        suggestion: 'Create the token directory or set DESIGN_TOKENS_PATH to point to your tokens',
        recoveryAction: `mkdir -p "${directory}"`,
        technicalDetails: `Checked path: ${resolve(directory)}`,
      });
      return errors;
    }

    try {
      const stat = statSync(directory);
      
      if (!stat.isDirectory()) {
        errors.push({
          type: FileErrorType.DIRECTORY_NOT_ACCESSIBLE,
          message: `Path exists but is not a directory: ${directory}`,
          filePath: directory,
          suggestion: 'Remove the file and create a directory, or use a different path',
          technicalDetails: `Path type: ${stat.isFile() ? 'file' : 'other'}`,
        });
        return errors;
      }

      // Check directory permissions
      try {
        readdirSync(directory);
      } catch (permError) {
        errors.push({
          type: FileErrorType.INVALID_PERMISSIONS,
          message: `Cannot read token directory: ${directory}`,
          filePath: directory,
          suggestion: 'Check directory permissions and ensure read access',
          recoveryAction: `chmod +r "${directory}"`,
          technicalDetails: String(permError),
        });
      }

    } catch (error) {
      errors.push({
        type: FileErrorType.DIRECTORY_NOT_ACCESSIBLE,
        message: `Cannot access token directory: ${directory}`,
        filePath: directory,
        suggestion: 'Check that the path exists and you have permission to access it',
        technicalDetails: String(error),
      });
    }

    return errors;
  }

  static analyzeFileError(filePath: string): FileError | null {
    if (!existsSync(filePath)) {
      return {
        type: FileErrorType.FILE_NOT_FOUND,
        message: `Token file not found: ${filePath}`,
        filePath,
        suggestion: 'Check the file path and ensure the file exists',
        recoveryAction: 'Create the missing token file or update the file path',
        technicalDetails: `Resolved path: ${resolve(filePath)}`,
      };
    }

    try {
      const stat = statSync(filePath);

      // Check if it's a file
      if (!stat.isFile()) {
        if (stat.isDirectory()) {
          return {
            type: FileErrorType.FILE_NOT_ACCESSIBLE,
            message: `Expected file but found directory: ${filePath}`,
            filePath,
            suggestion: 'Use a file path instead of a directory path',
          };
        }
        
        if (stat.isSymbolicLink()) {
          return {
            type: FileErrorType.SYMLINK_BROKEN,
            message: `Symbolic link may be broken: ${filePath}`,
            filePath,
            suggestion: 'Check that the symbolic link points to a valid token file',
            recoveryAction: `ls -la "${filePath}"`,
          };
        }
        
        return {
          type: FileErrorType.FILE_NOT_ACCESSIBLE,
          message: `Path is not a regular file: ${filePath}`,
          filePath,
          suggestion: 'Ensure the path points to a regular file, not a special file type',
        };
      }

      // Check file size
      if (stat.size === 0) {
        return {
          type: FileErrorType.FILE_EMPTY,
          message: `Token file is empty: ${filePath}`,
          filePath,
          suggestion: 'Add valid W3C Design Token content to the file',
          recoveryAction: 'echo \'{"tokens": {}}\' > "' + filePath + '"',
        };
      }

      if (stat.size < FileErrorHandler.MIN_FILE_SIZE) {
        return {
          type: FileErrorType.FILE_CORRUPTED,
          message: `Token file is too small to be valid: ${filePath} (${stat.size} bytes)`,
          filePath,
          suggestion: 'File may be corrupted or truncated. Restore from backup or recreate',
          technicalDetails: `File size: ${stat.size} bytes, minimum expected: ${FileErrorHandler.MIN_FILE_SIZE} bytes`,
        };
      }

      if (stat.size > FileErrorHandler.MAX_FILE_SIZE) {
        return {
          type: FileErrorType.FILE_TOO_LARGE,
          message: `Token file is unusually large: ${filePath} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`,
          filePath,
          suggestion: 'Consider splitting large token files into smaller, category-specific files',
          technicalDetails: `File size: ${stat.size} bytes, maximum recommended: ${FileErrorHandler.MAX_FILE_SIZE} bytes`,
        };
      }

      // Try to read the file to check for corruption
      try {
        const content = require('fs').readFileSync(filePath, 'utf8');
        
        // Basic corruption checks
        if (content.includes('\0')) {
          return {
            type: FileErrorType.FILE_CORRUPTED,
            message: `Token file contains null bytes (binary data): ${filePath}`,
            filePath,
            suggestion: 'File appears to be corrupted or is not a text file. Restore from backup',
            technicalDetails: 'File contains null bytes indicating binary corruption',
          };
        }

        // Check if it looks like JSON
        const trimmed = content.trim();
        if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          return {
            type: FileErrorType.FILE_CORRUPTED,
            message: `Token file does not appear to be JSON: ${filePath}`,
            filePath,
            suggestion: 'Ensure the file contains valid JSON format starting with { or [',
            technicalDetails: `File starts with: ${trimmed.substring(0, 50)}...`,
          };
        }

        // Try to parse as JSON
        try {
          JSON.parse(content);
        } catch (jsonError) {
          return {
            type: FileErrorType.FILE_CORRUPTED,
            message: `Token file contains invalid JSON: ${filePath}`,
            filePath,
            suggestion: 'Fix JSON syntax errors in the file',
            technicalDetails: String(jsonError),
          };
        }

      } catch (readError) {
        return {
          type: FileErrorType.FILE_NOT_ACCESSIBLE,
          message: `Cannot read token file: ${filePath}`,
          filePath,
          suggestion: 'Check file permissions and ensure read access',
          recoveryAction: `chmod +r "${filePath}"`,
          technicalDetails: String(readError),
        };
      }

    } catch (error) {
      return {
        type: FileErrorType.FILE_NOT_ACCESSIBLE,
        message: `Cannot access token file: ${filePath}`,
        filePath,
        suggestion: 'Check file permissions and path validity',
        technicalDetails: String(error),
      };
    }

    return null; // No errors found
  }

  static generateHelpfulErrorMessage(error: FileError): string {
    let message = `❌ ${error.message}`;

    if (error.suggestion) {
      message += `\n   💡 Suggestion: ${error.suggestion}`;
    }

    if (error.recoveryAction) {
      message += `\n   🔧 Recovery: ${error.recoveryAction}`;
    }

    if (error.technicalDetails) {
      message += `\n   🔍 Details: ${error.technicalDetails}`;
    }

    return message;
  }

  static getCommonSolutions(errorType: FileErrorType): string[] {
    const solutions: Record<FileErrorType, string[]> = {
      [FileErrorType.DIRECTORY_NOT_FOUND]: [
        'Create the tokens directory: mkdir -p ./design-system-mcp/tokens',
        'Set DESIGN_TOKENS_PATH environment variable to your token directory',
        'Copy sample tokens from examples/ directory',
      ],
      [FileErrorType.NO_TOKEN_FILES]: [
        'Add .json files containing W3C Design Tokens to the directory',
        'Copy sample token files from the examples/ directory',
        'Ensure token files have .json extension and valid content',
      ],
      [FileErrorType.FILE_NOT_FOUND]: [
        'Check that the file path is correct',
        'Restore the file from backup if it was accidentally deleted',
        'Create a new token file with valid W3C Design Token content',
      ],
      [FileErrorType.FILE_CORRUPTED]: [
        'Restore the file from backup',
        'Recreate the file with valid JSON content',
        'Use a JSON validator to check file syntax',
      ],
      [FileErrorType.INVALID_PERMISSIONS]: [
        'Fix file permissions: chmod +r filename.json',
        'Fix directory permissions: chmod +rx directory/',
        'Run with appropriate user permissions',
      ],
      [FileErrorType.FILE_EMPTY]: [
        'Add valid W3C Design Token content to the file',
        'Start with a minimal token: {"colors": {"primary": {"$type": "color", "$value": "#000"}}}',
        'Copy content from example token files',
      ],
      [FileErrorType.DIRECTORY_NOT_ACCESSIBLE]: [
        'Check directory permissions',
        'Ensure the path is correct',
        'Run with appropriate user permissions',
      ],
      [FileErrorType.FILE_NOT_ACCESSIBLE]: [
        'Check file permissions',
        'Ensure the file is not locked by another process',
        'Verify the file path is correct',
      ],
      [FileErrorType.FILE_TOO_LARGE]: [
        'Split large token files into smaller category-specific files',
        'Remove unused or duplicate tokens',
        'Consider using token references to reduce file size',
      ],
      [FileErrorType.SYMLINK_BROKEN]: [
        'Fix the symbolic link target',
        'Replace the symlink with the actual file',
        'Check that the target file exists',
      ],
    };

    return solutions[errorType] || [];
  }

  static diagnoseTokenSetup(directory?: string): { 
    isHealthy: boolean; 
    errors: FileError[];
    warnings: string[];
    recommendations: string[];
  } {
    const tokenDir = directory || process.env.DESIGN_TOKENS_PATH || './design-system-mcp/tokens';
    const errors: FileError[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check directory
    const dirErrors = FileErrorHandler.analyzeDirectoryError(tokenDir);
    errors.push(...dirErrors);

    if (errors.length > 0) {
      return { isHealthy: false, errors, warnings, recommendations };
    }

    // Check for token files
    try {
      const discovery = new TokenFileDiscovery(tokenDir);
      const result = discovery.discoverTokenFiles();

      if (result.files.length === 0) {
        errors.push({
          type: FileErrorType.NO_TOKEN_FILES,
          message: `No token files found in ${tokenDir}`,
          filePath: tokenDir,
          suggestion: 'Add .json files containing W3C Design Tokens',
        });
      } else {
        // Check each file
        for (const file of result.files) {
          const fileError = FileErrorHandler.analyzeFileError(file.path);
          if (fileError) {
            errors.push(fileError);
          }
        }

        // Generate warnings and recommendations
        if (result.files.length === 1) {
          warnings.push('Only one token file found. Consider organizing tokens into separate files by category');
          recommendations.push('Create separate files for colors, typography, spacing, etc.');
        }

        if (result.files.length > 20) {
          warnings.push('Large number of token files found. Consider consolidating related tokens');
        }

        const totalSize = result.files.reduce((sum, f) => sum + f.size, 0);
        if (totalSize > FileErrorHandler.MAX_FILE_SIZE) {
          warnings.push(`Total token files size is large (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
          recommendations.push('Consider optimizing token files or splitting into smaller chunks');
        }

        if (result.parsedResult.errors.length > 0) {
          warnings.push(`${result.parsedResult.errors.length} parsing errors found in token files`);
        }
      }

    } catch (error) {
      errors.push({
        type: FileErrorType.DIRECTORY_NOT_ACCESSIBLE,
        message: `Failed to scan token directory: ${tokenDir}`,
        technicalDetails: String(error),
      });
    }

    return {
      isHealthy: errors.length === 0,
      errors,
      warnings,
      recommendations,
    };
  }
}

// Enhanced discovery with error handling
export function discoverDesignTokensWithErrorHandling(directory?: string): {
  result: TokenDiscoveryResult;
  fileErrors: FileError[];
  healthCheck: ReturnType<typeof FileErrorHandler.diagnoseTokenSetup>;
} {
  const discovery = new TokenFileDiscovery(directory);
  const result = discovery.discoverTokenFiles();
  const healthCheck = FileErrorHandler.diagnoseTokenSetup(directory);
  
  // Analyze each file that failed to load
  const fileErrors: FileError[] = [];
  
  if (result.files.length === 0 && result.discoveryErrors.length > 0) {
    // Directory-level errors
    const dirErrors = FileErrorHandler.analyzeDirectoryError(result.directory);
    fileErrors.push(...dirErrors);
  }

  return {
    result,
    fileErrors,
    healthCheck,
  };
}

// Utility for formatting comprehensive error reports
export function formatFileErrorReport(errors: FileError[]): string {
  if (errors.length === 0) {
    return '✅ No file errors detected';
  }

  const parts: string[] = [];
  parts.push(`🚨 Found ${errors.length} file error${errors.length > 1 ? 's' : ''}:\n`);

  const groupedErrors = new Map<FileErrorType, FileError[]>();
  for (const error of errors) {
    if (!groupedErrors.has(error.type)) {
      groupedErrors.set(error.type, []);
    }
    groupedErrors.get(error.type)!.push(error);
  }

  for (const [type, typeErrors] of groupedErrors.entries()) {
    parts.push(`\n📋 ${type.replace(/_/g, ' ').toLowerCase()} (${typeErrors.length}):`);
    
    for (const error of typeErrors) {
      parts.push(`\n${FileErrorHandler.generateHelpfulErrorMessage(error)}`);
    }

    // Add common solutions for this error type
    const solutions = FileErrorHandler.getCommonSolutions(type);
    if (solutions.length > 0) {
      parts.push(`\n   📚 Common solutions:`);
      for (const solution of solutions) {
        parts.push(`     • ${solution}`);
      }
    }
    parts.push('');
  }

  return parts.join('\n');
}