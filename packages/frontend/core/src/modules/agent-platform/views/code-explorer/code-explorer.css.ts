import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const explorerPage = style({
  display: 'flex',
  height: '100%',
  width: '100%',
  overflow: 'hidden',
  background: cssVarV2.layer.background.primary,
});

export const fileTreePanel = style({
  width: '260px',
  minWidth: '200px',
  maxWidth: '400px',
  height: '100%',
  overflow: 'auto',
  borderRight: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  display: 'flex',
  flexDirection: 'column',
  background: cssVarV2.layer.background.secondary,
});

export const fileTreeHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: cssVarV2.text.secondary,
  borderBottom: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  flexShrink: 0,
});

export const fileTreeContent = style({
  flex: 1,
  overflow: 'auto',
  padding: '4px 0',
});

export const treeItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 8px',
  fontSize: '12px',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: cssVarV2.text.primary,
  ':hover': { background: cssVarV2.layer.background.hoverOverlay },
});

export const treeItemActive = style({
  background: `${cssVarV2.button.primary}20`,
  fontWeight: 500,
});

export const treeItemIcon = style({
  fontSize: '10px',
  width: '14px',
  textAlign: 'center',
  flexShrink: 0,
  color: cssVarV2.text.secondary,
});

export const treeItemName = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const editorPanel = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minWidth: 0,
});

export const tabBar = style({
  display: 'flex',
  alignItems: 'center',
  height: '36px',
  overflow: 'auto',
  borderBottom: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  background: cssVarV2.layer.background.secondary,
  flexShrink: 0,
});

export const tab = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '0 12px',
  height: '100%',
  fontSize: '12px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  borderRight: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  color: cssVarV2.text.secondary,
  ':hover': { background: cssVarV2.layer.background.hoverOverlay },
});

export const tabActive = style({
  color: cssVarV2.text.primary,
  background: cssVarV2.layer.background.primary,
  fontWeight: 500,
});

export const tabModified = style({
  selectors: {
    '&::after': {
      content: '""',
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: '#f59e0b',
      marginLeft: '2px',
    },
  },
});

export const tabClose = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '3px',
  fontSize: '10px',
  color: cssVarV2.text.secondary,
  ':hover': { background: cssVarV2.layer.background.hoverOverlay, color: cssVarV2.text.primary },
});

export const editorContainer = style({
  flex: 1,
  overflow: 'hidden',
});

export const emptyState = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: cssVarV2.text.secondary,
  fontSize: '13px',
});

export const branchBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '11px',
  fontFamily: 'monospace',
  background: `${cssVarV2.button.primary}15`,
  color: cssVarV2.text.primary,
});

export const loadingOverlay = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: cssVarV2.text.secondary,
  fontSize: '13px',
});

export const saveIndicator = style({
  fontSize: '11px',
  padding: '0 12px',
  color: '#16a34a',
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  flexShrink: 0,
});

export const errorIndicator = style({
  fontSize: '11px',
  padding: '0 12px',
  color: '#dc2626',
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  flexShrink: 0,
});
