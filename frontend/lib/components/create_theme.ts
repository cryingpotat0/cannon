// Copied from thememirror to extend it to panel theming.

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting, } from '@codemirror/language';

import { Extension } from '@codemirror/state';
import { TagStyle } from '@codemirror/language';

export interface ThemeOptions {
  /**
   * Theme variant. Determines which styles CodeMirror will apply by default.
   */
  variant: Variant;
  /**
   * Settings to customize the look of the editor, like background, gutter, selection and others.
   */
  settings: Settings;
  /**
   * Syntax highlighting styles.
   */
  styles: TagStyle[];
}
declare type Variant = 'light' | 'dark';
interface Settings {
  /**
   * Editor background.
   */
  background: string;
  /**
   * Default text color.
   */
  foreground: string;
  /**
   * Caret color.
   */
  caret: string;
  /**
   * Selection background.
   */
  selection: string;
  /**
   * Background of highlighted lines.
   */
  lineHighlight: string;
  /**
   * Gutter background.
   */
  gutterBackground: string;
  /**
   * Text color inside gutter.
   */
  gutterForeground: string;
}

export const createTheme = ({ variant, settings, styles }: ThemeOptions): Extension => {
  const theme = EditorView.theme({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&': {
      backgroundColor: settings.background,
      color: settings.foreground,
    },
    '.cm-content': {
      caretColor: settings.caret,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: settings.caret,
    },
    '&.cm-focused .cm-selectionBackgroundm .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: settings.selection,
    },
    '.cm-activeLine': {
      backgroundColor: settings.lineHighlight,
    },
    '.cm-gutters': {
      backgroundColor: settings.gutterBackground,
      color: settings.gutterForeground,
    },
    '.cm-activeLineGutter': {
      backgroundColor: settings.lineHighlight,
    },
    '.cm-panels': {
      backgroundColor: settings.background,
      color: settings.foreground,
    },
    '.cm-panels-top': {
      borderBottom: '0px'
    },
  }, {
    dark: variant === 'dark',
  });
  const highlightStyle = HighlightStyle.define(styles);
  const extension = [theme, syntaxHighlighting(highlightStyle)];
  return extension;
};

