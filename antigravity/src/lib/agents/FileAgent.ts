// File Agent - Handles file operations, organization, and management
// Reads, writes, organizes, and transforms files

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';

export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    isDirectory: boolean;
    isFile: boolean;
    permissions: string;
    mimeType?: string;
}

export interface FileContent {
    path: string;
    content: string | Buffer;
    encoding: string;
    size: number;
    lines?: number;
}

export interface SearchResult {
    files: FileInfo[];
    query: string;
    totalResults: number;
    searchTime: number;
}

export interface OrganizationPlan {
    actions: OrganizationAction[];
    estimatedTime: number;
    filesAffected: number;
}

export interface OrganizationAction {
    type: 'move' | 'copy' | 'rename' | 'delete' | 'compress';
    source: string;
    destination?: string;
    reason: string;
}

export interface FileAgentConfig {
    rootDirectory: string;
    allowedExtensions?: string[];
    maxFileSize?: number;
    backupEnabled: boolean;
    trashDirectory?: string;
}

// File type categories
const fileCategories: Record<string, string[]> = {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
    spreadsheets: ['.xls', '.xlsx', '.csv', '.ods'],
    presentations: ['.ppt', '.pptx', '.odp'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    videos: ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    audio: ['.mp3', '.wav', '.ogg', '.flac', '.m4a'],
    code: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb'],
    data: ['.json', '.xml', '.yaml', '.yml', '.sql', '.db'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
};

export class FileAgent {
    private config: FileAgentConfig;
    private recentFiles: FileInfo[] = [];
    private watchList: Set<string> = new Set();

    constructor(config?: Partial<FileAgentConfig>) {
        this.config = {
            rootDirectory: config?.rootDirectory || process.cwd(),
            allowedExtensions: config?.allowedExtensions,
            maxFileSize: config?.maxFileSize || 100 * 1024 * 1024, // 100MB
            backupEnabled: config?.backupEnabled ?? true,
            trashDirectory: config?.trashDirectory,
            ...config,
        };
    }

    // Main execution method
    async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (intent.primaryIntent) {
                case 'search_files':
                    result = await this.searchFiles(intent.parameters.query || intent.rawInput);
                    break;
                case 'organize_files':
                    result = await this.organizeFiles(intent.parameters);
                    break;
                case 'create_document':
                    result = await this.createDocument(intent.parameters);
                    break;
                default:
                    result = await this.handleGeneralFileTask(intent);
            }

            return {
                success: true,
                agentId: agent.id,
                action: intent.action,
                output: result,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                success: false,
                agentId: agent.id,
                action: intent.action,
                output: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime,
            };
        }
    }

    // Read file
    async readFile(path: string): Promise<FileContent> {
        const normalizedPath = this.normalizePath(path);

        // In real implementation, this would use fs module
        const content = '';

        return {
            path: normalizedPath,
            content,
            encoding: 'utf-8',
            size: 0,
            lines: 0,
        };
    }

    // Write file
    async writeFile(path: string, content: string | Buffer): Promise<FileInfo> {
        const normalizedPath = this.normalizePath(path);

        // In real implementation, this would use fs module

        return {
            path: normalizedPath,
            name: this.getFileName(normalizedPath),
            extension: this.getFileExtension(normalizedPath),
            size: typeof content === 'string' ? content.length : content.length,
            created: new Date(),
            modified: new Date(),
            accessed: new Date(),
            isDirectory: false,
            isFile: true,
            permissions: 'rw-r--r--',
        };
    }

    // Delete file
    async deleteFile(path: string): Promise<boolean> {
        const normalizedPath = this.normalizePath(path);

        // Backup if enabled
        if (this.config.backupEnabled && this.config.trashDirectory) {
            await this.moveToTrash(normalizedPath);
        }

        // In real implementation, this would use fs module
        return true;
    }

    // Move file
    async moveFile(source: string, destination: string): Promise<FileInfo> {
        const normalizedSource = this.normalizePath(source);
        const normalizedDest = this.normalizePath(destination);

        // In real implementation, this would use fs module

        return {
            path: normalizedDest,
            name: this.getFileName(normalizedDest),
            extension: this.getFileExtension(normalizedDest),
            size: 0,
            created: new Date(),
            modified: new Date(),
            accessed: new Date(),
            isDirectory: false,
            isFile: true,
            permissions: 'rw-r--r--',
        };
    }

    // Copy file
    async copyFile(source: string, destination: string): Promise<FileInfo> {
        const normalizedSource = this.normalizePath(source);
        const normalizedDest = this.normalizePath(destination);

        // In real implementation, this would use fs module

        return {
            path: normalizedDest,
            name: this.getFileName(normalizedDest),
            extension: this.getFileExtension(normalizedDest),
            size: 0,
            created: new Date(),
            modified: new Date(),
            accessed: new Date(),
            isDirectory: false,
            isFile: true,
            permissions: 'rw-r--r--',
        };
    }

    // Search files
    async searchFiles(query: string, options?: {
        extension?: string;
        maxSize?: number;
        modifiedAfter?: Date;
        modifiedBefore?: Date;
    }): Promise<SearchResult> {
        const startTime = Date.now();

        // In real implementation, this would use fs module with glob patterns
        const files: FileInfo[] = [];

        return {
            files,
            query,
            totalResults: files.length,
            searchTime: Date.now() - startTime,
        };
    }

    // List directory
    async listDirectory(path: string): Promise<FileInfo[]> {
        const normalizedPath = this.normalizePath(path);

        // In real implementation, this would use fs.readdir
        return [];
    }

    // Create directory
    async createDirectory(path: string): Promise<FileInfo> {
        const normalizedPath = this.normalizePath(path);

        return {
            path: normalizedPath,
            name: this.getFileName(normalizedPath),
            extension: '',
            size: 0,
            created: new Date(),
            modified: new Date(),
            accessed: new Date(),
            isDirectory: true,
            isFile: false,
            permissions: 'rwxr-xr-x',
        };
    }

    // Organize files
    async organizeFiles(params: Record<string, any>): Promise<OrganizationPlan> {
        const { directory, strategy = 'byType', dryRun = true } = params;

        const actions: OrganizationAction[] = [];

        // Get all files in directory
        const files = await this.listDirectory(directory || this.config.rootDirectory);

        // Generate organization plan based on strategy
        for (const file of files) {
            if (file.isDirectory) continue;

            let destination: string;
            let reason: string;

            switch (strategy) {
                case 'byType':
                    const category = this.getFileCategory(file.extension);
                    destination = `${directory}/${category}/${file.name}`;
                    reason = `Organizing by file type into ${category} folder`;
                    break;

                case 'byDate':
                    const dateFolder = file.modified.toISOString().split('T')[0];
                    destination = `${directory}/${dateFolder}/${file.name}`;
                    reason = `Organizing by modification date`;
                    break;

                case 'bySize':
                    const sizeCategory = this.getSizeCategory(file.size);
                    destination = `${directory}/${sizeCategory}/${file.name}`;
                    reason = `Organizing by file size`;
                    break;

                default:
                    continue;
            }

            actions.push({
                type: 'move',
                source: file.path,
                destination,
                reason,
            });
        }

        return {
            actions,
            estimatedTime: actions.length * 100, // ~100ms per file
            filesAffected: actions.length,
        };
    }

    // Create document
    async createDocument(params: Record<string, any>): Promise<{ file: FileInfo; content: FileContent }> {
        const { name, type = 'txt', content = '', directory } = params;

        const extension = type.startsWith('.') ? type : `.${type}`;
        const fileName = name.endsWith(extension) ? name : `${name}${extension}`;
        const path = directory
            ? `${directory}/${fileName}`
            : `${this.config.rootDirectory}/${fileName}`;

        const fileInfo = await this.writeFile(path, content);

        return {
            file: fileInfo,
            content: {
                path,
                content,
                encoding: 'utf-8',
                size: typeof content === 'string' ? content.length : content.length,
            },
        };
    }

    // Convert file
    async convertFile(source: string, targetFormat: string): Promise<FileContent> {
        const sourcePath = this.normalizePath(source);
        const content = await this.readFile(sourcePath);

        // In real implementation, this would use appropriate conversion libraries
        // For example: pandoc for documents, sharp for images, ffmpeg for videos

        const newPath = sourcePath.replace(/\.[^.]+$/, targetFormat);

        return {
            path: newPath,
            content: content.content,
            encoding: content.encoding,
            size: content.size,
        };
    }

    // Compress files
    async compressFiles(files: string[], archiveName: string): Promise<FileInfo> {
        const archivePath = this.normalizePath(archiveName);

        // In real implementation, this would use archiver or similar library

        return {
            path: archivePath,
            name: this.getFileName(archivePath),
            extension: '.zip',
            size: 0,
            created: new Date(),
            modified: new Date(),
            accessed: new Date(),
            isDirectory: false,
            isFile: true,
            permissions: 'rw-r--r--',
        };
    }

    // Extract archive
    async extractArchive(archivePath: string, destination: string): Promise<FileInfo[]> {
        const normalizedArchive = this.normalizePath(archivePath);
        const normalizedDest = this.normalizePath(destination);

        // In real implementation, this would use unzip or similar library

        return [];
    }

    // Watch file/directory for changes
    watch(path: string, callback: (event: string, file: FileInfo) => void): void {
        const normalizedPath = this.normalizePath(path);
        this.watchList.add(normalizedPath);

        // In real implementation, this would use fs.watch
    }

    // Stop watching
    unwatch(path: string): void {
        const normalizedPath = this.normalizePath(path);
        this.watchList.delete(normalizedPath);
    }

    // Handle general file task
    private async handleGeneralFileTask(intent: ParsedIntent): Promise<any> {
        const input = intent.rawInput.toLowerCase();

        if (input.includes('read') || input.includes('show') || input.includes('display')) {
            const path = intent.entities.find(e => e.type === 'file_path')?.value;
            if (path) {
                return this.readFile(path);
            }
        }

        if (input.includes('list') || input.includes('show files')) {
            const path = intent.entities.find(e => e.type === 'file_path')?.value;
            return this.listDirectory(path || this.config.rootDirectory);
        }

        if (input.includes('create') || input.includes('make')) {
            return this.createDocument({ name: 'new_file', type: 'txt' });
        }

        return {
            message: 'File task processed',
            suggestions: [
                'Read a file',
                'Write a file',
                'Search for files',
                'Organize files',
                'Convert a file',
            ],
        };
    }

    // Helper methods
    private normalizePath(path: string): string {
        // Normalize path separators and resolve relative paths
        return path.replace(/\\/g, '/');
    }

    private getFileName(path: string): string {
        return path.split('/').pop() || path;
    }

    private getFileExtension(path: string): string {
        const parts = path.split('.');
        return parts.length > 1 ? `.${parts.pop()}` : '';
    }

    private getFileCategory(extension: string): string {
        for (const [category, extensions] of Object.entries(fileCategories)) {
            if (extensions.includes(extension.toLowerCase())) {
                return category;
            }
        }
        return 'other';
    }

    private getSizeCategory(size: number): string {
        if (size < 1024) return 'tiny'; // < 1KB
        if (size < 1024 * 1024) return 'small'; // < 1MB
        if (size < 100 * 1024 * 1024) return 'medium'; // < 100MB
        if (size < 1024 * 1024 * 1024) return 'large'; // < 1GB
        return 'huge'; // >= 1GB
    }

    private async moveToTrash(path: string): Promise<void> {
        if (!this.config.trashDirectory) return;

        const trashPath = `${this.config.trashDirectory}/${Date.now()}_${this.getFileName(path)}`;
        // In real implementation, move file to trash
    }

    // Get file info
    async getFileInfo(path: string): Promise<FileInfo | null> {
        const normalizedPath = this.normalizePath(path);

        // In real implementation, this would use fs.stat

        return null;
    }

    // Get recent files
    getRecentFiles(): FileInfo[] {
        return [...this.recentFiles];
    }

    // Get watched paths
    getWatchedPaths(): string[] {
        return Array.from(this.watchList);
    }
}

// Export factory function
export function createFileAgent(config?: Partial<FileAgentConfig>): FileAgent {
    return new FileAgent(config);
}
