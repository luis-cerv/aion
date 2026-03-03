/**
 * File Explorer Service — reads file trees and file contents from the repo.
 * Reuses RepoSecurityService for path validation.
 */
import { Injectable, Logger } from '@nestjs/common';
import { readdir, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import type { FileTreeNode, FileContent } from '@aion/agent-contracts';
import { RepoSecurityService } from './security';

const MAX_DEPTH = 10;
const MAX_NODES = 5000;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const BINARY_CHECK_SIZE = 8 * 1024; // 8KB

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  '.yarn',
  '.pnp',
  '__pycache__',
  '.cache',
]);

const EXT_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.json': 'json',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.svg': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'ini',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.dockerfile': 'dockerfile',
  '.prisma': 'prisma',
  '.vue': 'html',
  '.svelte': 'html',
  '.lua': 'lua',
  '.r': 'r',
  '.php': 'php',
  '.pl': 'perl',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.clj': 'clojure',
  '.ini': 'ini',
  '.env': 'ini',
  '.txt': 'plaintext',
  '.log': 'plaintext',
};

@Injectable()
export class FileExplorerService {
  private readonly logger = new Logger(FileExplorerService.name);

  constructor(private readonly security: RepoSecurityService) {}

  /**
   * Recursively build a file tree from the repo root.
   */
  async getFileTree(repoRoot: string): Promise<FileTreeNode[]> {
    let nodeCount = 0;

    const walk = async (
      dir: string,
      relativePath: string,
      depth: number
    ): Promise<FileTreeNode[]> => {
      if (depth > MAX_DEPTH || nodeCount >= MAX_NODES) return [];

      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return [];
      }

      // Sort: directories first, then alphabetical
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      const nodes: FileTreeNode[] = [];

      for (const entry of entries) {
        if (nodeCount >= MAX_NODES) break;

        const name = entry.name;
        const entryPath = relativePath ? `${relativePath}/${name}` : name;

        if (entry.isDirectory()) {
          if (EXCLUDED_DIRS.has(name) || name.startsWith('.')) continue;

          nodeCount++;
          const children = await walk(
            join(dir, name),
            entryPath,
            depth + 1
          );
          nodes.push({
            name,
            path: entryPath,
            type: 'directory',
            children,
          });
        } else {
          nodeCount++;
          let size: number | undefined;
          try {
            const s = await stat(join(dir, name));
            size = s.size;
          } catch {
            // skip
          }
          nodes.push({ name, path: entryPath, type: 'file', size });
        }
      }

      return nodes;
    };

    return walk(repoRoot, '', 0);
  }

  /**
   * Read a single file from the repo.
   */
  async readFile(
    repoRoot: string,
    filePath: string
  ): Promise<FileContent> {
    this.security.validatePatchPath(filePath, repoRoot);

    const fullPath = join(repoRoot, filePath);
    const fileStat = await stat(fullPath);

    if (fileStat.size > MAX_FILE_SIZE) {
      return {
        path: filePath,
        content: `File too large (${(fileStat.size / 1024 / 1024).toFixed(1)}MB). Max: 2MB.`,
        language: 'plaintext',
        size: fileStat.size,
        encoding: 'utf-8',
      };
    }

    const buffer = await readFile(fullPath);

    // Check for binary content in first 8KB
    const checkSlice = buffer.subarray(0, BINARY_CHECK_SIZE);
    if (checkSlice.includes(0)) {
      return {
        path: filePath,
        content: 'Binary file — cannot display.',
        language: 'plaintext',
        size: fileStat.size,
        encoding: 'binary',
      };
    }

    const content = buffer.toString('utf-8');
    const ext = extname(filePath).toLowerCase();
    const language = this.detectLanguage(filePath, ext);

    return {
      path: filePath,
      content,
      language,
      size: fileStat.size,
      encoding: 'utf-8',
    };
  }

  /**
   * Write content to a file in the repo.
   */
  async writeFile(
    repoRoot: string,
    filePath: string,
    content: string
  ): Promise<{ ok: boolean; path: string; size: number }> {
    this.security.validatePatchPath(filePath, repoRoot);

    const fullPath = join(repoRoot, filePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, 'utf-8');

    const fileStat = await stat(fullPath);
    this.logger.log(`Wrote file: ${filePath} (${fileStat.size} bytes)`);

    return { ok: true, path: filePath, size: fileStat.size };
  }

  private detectLanguage(filePath: string, ext: string): string {
    // Special filenames
    const name = filePath.split('/').pop()?.toLowerCase() ?? '';
    if (name === 'dockerfile' || name.startsWith('dockerfile.'))
      return 'dockerfile';
    if (name === 'makefile' || name === 'gnumakefile') return 'makefile';
    if (name === '.gitignore' || name === '.dockerignore') return 'ini';
    if (name === 'package.json' || name === 'tsconfig.json') return 'json';

    return EXT_LANGUAGE_MAP[ext] ?? 'plaintext';
  }
}
