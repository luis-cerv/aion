/**
 * Recursive file tree component for the code explorer.
 */
import { memo, useCallback, useState } from 'react';
import type { FileTreeNode } from '@aion/agent-contracts';
import * as styles from './code-explorer.css';

interface FileTreeProps {
  nodes: FileTreeNode[];
  activePath: string | null;
  onFileSelect: (path: string) => void;
}

export const FileTree = memo(function FileTree({
  nodes,
  activePath,
  onFileSelect,
}: FileTreeProps) {
  return (
    <div>
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          activePath={activePath}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
});

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  activePath: string | null;
  onFileSelect: (path: string) => void;
}

const TreeNode = memo(function TreeNode({
  node,
  depth,
  activePath,
  onFileSelect,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === 'directory';
  const isActive = node.path === activePath;

  const handleClick = useCallback(() => {
    if (isDir) {
      setExpanded((prev) => !prev);
    } else {
      onFileSelect(node.path);
    }
  }, [isDir, node.path, onFileSelect]);

  return (
    <>
      <div
        className={`${styles.treeItem} ${isActive ? styles.treeItemActive : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
        title={node.path}
      >
        <span className={styles.treeItemIcon}>
          {isDir ? (expanded ? '▾' : '▸') : getFileIcon(node.name)}
        </span>
        <span className={styles.treeItemName}>{node.name}</span>
      </div>
      {isDir && expanded && node.children && (
        <>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onFileSelect={onFileSelect}
            />
          ))}
        </>
      )}
    </>
  );
});

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'TS';
    case 'js':
    case 'jsx':
      return 'JS';
    case 'json':
      return '{}';
    case 'md':
    case 'mdx':
      return 'M';
    case 'css':
    case 'scss':
    case 'less':
      return '#';
    case 'html':
      return '<>';
    case 'svg':
    case 'png':
    case 'jpg':
    case 'gif':
      return '◻';
    case 'yaml':
    case 'yml':
      return 'Y';
    default:
      return '·';
  }
}
