/**
 * Design System MCP Server
 *
 * Provides three-layer access to W3C Design Tokens:
 * - Layer 1: Discovery (get_design_system_info)
 * - Layer 2: Understanding (get_category_tokens)
 * - Layer 3: Reference (get_token_reference)
 */
declare class DesignSystemMCPServer {
    private server;
    constructor();
    private setupToolHandlers;
    private handleGetDesignSystemInfo;
    private handleGetCategoryTokens;
    private handleGetTokenReference;
    private getCategoryDescription;
    private getTokenUsageHint;
    private getTokenExamples;
    private findRelatedTokens;
    private hasSimilarName;
    private setupErrorHandler;
    run(): Promise<void>;
}
export { DesignSystemMCPServer };
