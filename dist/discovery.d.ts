import { type ParsedTokensResult } from './parsers/w3c-tokens';
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
export declare class TokenFileDiscovery {
    private tokenDirectory?;
    private defaultTokensPath;
    constructor(tokenDirectory?: string | undefined);
    private getTokenDirectory;
    discoverTokenFiles(): TokenDiscoveryResult;
    private scanTokenFiles;
    private isTokenFile;
    private shouldScanSubdirectory;
    static getRecommendedTokenDirectory(): string;
    static createTokenDirectoryStructure(baseDir?: string): string[];
    static validateTokenDirectory(directory: string): {
        isValid: boolean;
        issues: string[];
    };
}
export declare function discoverDesignTokens(directory?: string): TokenDiscoveryResult;
export declare function getTokenFilesInDirectory(directory: string): TokenFileInfo[];
export declare function findTokenDirectory(): string | null;
export declare function getTokenDiscoverySummary(result: TokenDiscoveryResult): string;
export declare function getEnvironmentTokenPath(): string | undefined;
export declare function setEnvironmentTokenPath(path: string): void;
export declare function getTokenFileStats(filePath: string): TokenFileInfo | null;
export declare function isValidTokenDirectory(directory: string): boolean;
export declare enum FileErrorType {
    DIRECTORY_NOT_FOUND = "DIRECTORY_NOT_FOUND",
    DIRECTORY_NOT_ACCESSIBLE = "DIRECTORY_NOT_ACCESSIBLE",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FILE_NOT_ACCESSIBLE = "FILE_NOT_ACCESSIBLE",
    FILE_CORRUPTED = "FILE_CORRUPTED",
    FILE_EMPTY = "FILE_EMPTY",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    INVALID_PERMISSIONS = "INVALID_PERMISSIONS",
    NO_TOKEN_FILES = "NO_TOKEN_FILES",
    SYMLINK_BROKEN = "SYMLINK_BROKEN"
}
export interface FileError {
    type: FileErrorType;
    message: string;
    filePath?: string;
    suggestion?: string;
    recoveryAction?: string;
    technicalDetails?: string;
}
export declare class FileErrorHandler {
    private static readonly MAX_FILE_SIZE;
    private static readonly MIN_FILE_SIZE;
    static analyzeDirectoryError(directory: string): FileError[];
    static analyzeFileError(filePath: string): FileError | null;
    static generateHelpfulErrorMessage(error: FileError): string;
    static getCommonSolutions(errorType: FileErrorType): string[];
    static diagnoseTokenSetup(directory?: string): {
        isHealthy: boolean;
        errors: FileError[];
        warnings: string[];
        recommendations: string[];
    };
}
export declare function discoverDesignTokensWithErrorHandling(directory?: string): {
    result: TokenDiscoveryResult;
    fileErrors: FileError[];
    healthCheck: ReturnType<typeof FileErrorHandler.diagnoseTokenSetup>;
};
export declare function formatFileErrorReport(errors: FileError[]): string;
