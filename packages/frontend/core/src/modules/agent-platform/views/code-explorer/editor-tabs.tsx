/**
 * Tab bar for open files in the code explorer.
 */
import { memo, useCallback } from 'react';
import * as styles from './code-explorer.css';

export interface OpenFile {
  path: string;
  modified: boolean;
}

interface EditorTabsProps {
  files: OpenFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export const EditorTabs = memo(function EditorTabs({
  files,
  activePath,
  onSelect,
  onClose,
}: EditorTabsProps) {
  return (
    <div className={styles.tabBar}>
      {files.map((file) => (
        <Tab
          key={file.path}
          file={file}
          isActive={file.path === activePath}
          onSelect={onSelect}
          onClose={onClose}
        />
      ))}
    </div>
  );
});

interface TabProps {
  file: OpenFile;
  isActive: boolean;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

const Tab = memo(function Tab({ file, isActive, onSelect, onClose }: TabProps) {
  const name = file.path.split('/').pop() ?? file.path;

  const handleClick = useCallback(() => {
    onSelect(file.path);
  }, [onSelect, file.path]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(file.path);
    },
    [onClose, file.path]
  );

  return (
    <div
      className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${file.modified ? styles.tabModified : ''}`}
      onClick={handleClick}
      title={file.path}
    >
      <span>{name}</span>
      <span className={styles.tabClose} onClick={handleClose}>
        ×
      </span>
    </div>
  );
});
