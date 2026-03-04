/**
 * Code Explorer — full-page file browser + Monaco editor.
 * Rendered in a modal/overlay from the agent panel.
 */
import {
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useLiveData, useService } from '@toeverything/infra';
import { DocService } from '../../../doc';
import { WorkspaceService } from '../../../workspace';
import { AgentPlatformService } from '../../services/agent';
import { FileTree } from './file-tree';
import { EditorTabs, type OpenFile } from './editor-tabs';
import { MonacoWrapper } from './monaco-wrapper';
import type { FileContent } from '@aion/agent-contracts';
import * as styles from './code-explorer.css';

interface FileBuffer {
  original: string;
  current: string;
  language: string;
}

export const CodeExplorerPage = memo(function CodeExplorerPage({
  onClose,
}: {
  onClose: () => void;
}) {
  const agentService = useService(AgentPlatformService);
  const docService = useService(DocService);
  const workspaceService = useService(WorkspaceService);
  const docId = docService.doc.id;
  const workspaceId = workspaceService.workspace.id;

  const fileTree = useLiveData(agentService.fileTree$);
  const treeLoading = useLiveData(agentService.fileTreeLoading$);

  // Open files state
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [buffers, setBuffers] = useState<Map<string, FileBuffer>>(new Map());
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load tree on mount
  useEffect(() => {
    void agentService.loadFileTree(workspaceId, docId);
  }, [agentService, workspaceId, docId]);

  // Open a file
  const handleFileSelect = useCallback(
    (path: string) => {
      // If already open, just activate
      if (buffers.has(path)) {
        setActivePath(path);
        if (!openFiles.some(f => f.path === path)) {
          setOpenFiles(prev => [...prev, { path, modified: false }]);
        }
        return;
      }

      void agentService
        .readRepoFile(workspaceId, path, docId)
        .then((file: FileContent) => {
          setBuffers(prev => {
            const next = new Map(prev);
            next.set(path, {
              original: file.content,
              current: file.content,
              language: file.language,
            });
            return next;
          });
          setOpenFiles(prev => {
            if (prev.some(f => f.path === path)) return prev;
            return [...prev, { path, modified: false }];
          });
          setActivePath(path);
        })
        .catch((err: unknown) => {
          setSaveError(
            `Failed to open ${path}: ${err instanceof Error ? err.message : String(err)}`
          );
          setTimeout(() => setSaveError(null), 3000);
        });
    },
    [agentService, workspaceId, docId, buffers, openFiles]
  );

  // Editor content change
  const handleChange = useCallback(
    (path: string, content: string) => {
      setBuffers((prev) => {
        const buf = prev.get(path);
        if (!buf) return prev;
        const next = new Map(prev);
        next.set(path, { ...buf, current: content });
        return next;
      });
      setOpenFiles((prev) =>
        prev.map((f) => {
          if (f.path !== path) return f;
          const buf = buffers.get(path);
          const modified = buf ? content !== buf.original : false;
          return { ...f, modified };
        })
      );
    },
    [buffers]
  );

  // Save (Ctrl+S)
  const handleSave = useCallback(
    (path: string, content: string) => {
      setSaveStatus('Saving...');
      setSaveError(null);
      void agentService
        .writeRepoFile(workspaceId, path, content, docId)
        .then(() => {
          setBuffers(prev => {
            const buf = prev.get(path);
            if (!buf) return prev;
            const next = new Map(prev);
            next.set(path, { ...buf, original: content, current: content });
            return next;
          });
          setOpenFiles(prev =>
            prev.map(f => (f.path === path ? { ...f, modified: false } : f))
          );
          setSaveStatus('Saved');
          setTimeout(() => setSaveStatus(null), 2000);
        })
        .catch((err: unknown) => {
          setSaveError(
            `Save failed: ${err instanceof Error ? err.message : String(err)}`
          );
          setTimeout(() => setSaveError(null), 5000);
        });
    },
    [agentService, workspaceId, docId]
  );

  // Close tab
  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenFiles((prev) => prev.filter((f) => f.path !== path));
      setBuffers((prev) => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });
      if (activePath === path) {
        setActivePath((prev) => {
          const remaining = openFiles.filter((f) => f.path !== path);
          return remaining.length > 0
            ? remaining[remaining.length - 1].path
            : null;
        });
      }
    },
    [activePath, openFiles]
  );

  const activeBuffer = activePath ? buffers.get(activePath) : null;

  return (
    <div className={styles.explorerPage}>
      {/* File tree panel */}
      <div className={styles.fileTreePanel}>
        <div className={styles.fileTreeHeader}>
          <span style={{ flex: 1 }}>Explorer</span>
          {fileTree && (
            <span className={styles.branchBadge}>{fileTree.branch || 'HEAD'}</span>
          )}
          <span
            style={{ cursor: 'pointer', fontSize: '14px' }}
            onClick={onClose}
            title="Close explorer"
          >
            ×
          </span>
        </div>
        <div className={styles.fileTreeContent}>
          {treeLoading && !fileTree && (
            <div className={styles.loadingOverlay}>Loading...</div>
          )}
          {fileTree && (
            <FileTree
              nodes={fileTree.tree}
              activePath={activePath}
              onFileSelect={handleFileSelect}
            />
          )}
          {!treeLoading && !fileTree && (
            <div className={styles.loadingOverlay}>
              No repo connected.
            </div>
          )}
        </div>
      </div>

      {/* Editor panel */}
      <div className={styles.editorPanel}>
        {openFiles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EditorTabs
              files={openFiles}
              activePath={activePath}
              onSelect={setActivePath}
              onClose={handleCloseTab}
            />
            {saveStatus && (
              <span className={styles.saveIndicator}>{saveStatus}</span>
            )}
            {saveError && (
              <span className={styles.errorIndicator}>{saveError}</span>
            )}
          </div>
        )}

        {activeBuffer ? (
          <MonacoWrapper
            key={activePath!}
            path={activePath!}
            content={activeBuffer.current}
            language={activeBuffer.language}
            onSave={handleSave}
            onChange={handleChange}
          />
        ) : (
          <div className={styles.emptyState}>
            Select a file from the tree to open it
          </div>
        )}
      </div>
    </div>
  );
});
