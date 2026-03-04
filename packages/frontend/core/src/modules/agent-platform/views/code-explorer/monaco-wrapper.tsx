/**
 * Monaco Editor wrapper with theme sync and save support.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import * as styles from './code-explorer.css';

interface MonacoWrapperProps {
  path: string;
  content: string;
  language: string;
  onSave: (path: string, content: string) => void;
  onChange: (path: string, content: string) => void;
}

function useTheme(): 'vs' | 'vs-dark' {
  const [theme, setTheme] = useState<'vs' | 'vs-dark'>(() => {
    if (typeof document === 'undefined') return 'vs-dark';
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? 'vs'
      : 'vs-dark';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      setTheme(t === 'light' ? 'vs' : 'vs-dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export const MonacoWrapper = memo(function MonacoWrapper({
  path,
  content,
  language,
  onSave,
  onChange,
}: MonacoWrapperProps) {
  const theme = useTheme();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;

  const handleMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      // Ctrl+S / Cmd+S to save
      editor.addCommand(
        // eslint-disable-next-line no-bitwise
        2048 | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
        () => {
          const value = editor.getValue();
          onSave(pathRef.current, value);
        }
      );
    },
    [onSave]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        onChange(pathRef.current, value);
      }
    },
    [onChange]
  );

  return (
    <div className={styles.editorContainer}>
      <Editor
        path={path}
        defaultValue={content}
        language={language}
        theme={theme}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          fontSize: 13,
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          tabSize: 2,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
});
