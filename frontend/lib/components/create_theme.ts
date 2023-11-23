// Copied from thememirror to extend it to panel theming.

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting, } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

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
      borderBottom: '0px',
      zIndex: 1,
    },
  }, {
    dark: variant === 'dark',
  });
  const highlightStyle = HighlightStyle.define(styles);
  const extension = [theme, syntaxHighlighting(highlightStyle)];
  return extension;
};


export const birdsOfParadise: ThemeOptions =
{
  variant: 'dark',
  settings: {
    background: '#3b2627',
    foreground: '#E6E1C4',
    caret: '#E6E1C4',
    selection: '#16120E',
    gutterBackground: '#3b2627',
    gutterForeground: '#E6E1C490',
    lineHighlight: '#1F1611',
  },
  styles: [
    {
      tag: t.comment,
      color: '#6B4E32',
    },
    {
      tag: [t.keyword, t.operator, t.derefOperator],
      color: '#EF5D32',
    },
    {
      tag: t.className,
      color: '#EFAC32',
      fontWeight: 'bold',
    },
    {
      tag: [
        t.typeName,
        t.propertyName,
        t.function(t.variableName),
        t.definition(t.variableName),
      ],
      color: '#EFAC32',
    },
    {
      tag: t.definition(t.typeName),
      color: '#EFAC32',
      fontWeight: 'bold',
    },
    {
      tag: t.labelName,
      color: '#EFAC32',
      fontWeight: 'bold',
    },
    {
      tag: [t.number, t.bool],
      color: '#6C99BB',
    },
    {
      tag: [t.variableName, t.self],
      color: '#7DAF9C',
    },
    {
      tag: [t.string, t.special(t.brace), t.regexp],
      color: '#D9D762',
    },
    {
      tag: [t.angleBracket, t.tagName, t.attributeName],
      color: '#EFCB43',
    },
  ],
}
  ;

export const solarizedLight: ThemeOptions = {
  variant: 'light',
  settings: {
    background: '#fef7e5',
    foreground: '#586E75',
    caret: '#000000',
    selection: '#073642',
    gutterBackground: '#fef7e5',
    gutterForeground: '#586E7580',
    lineHighlight: '#EEE8D5',
  },
  styles: [
    {
      tag: t.comment,
      color: '#93A1A1',
    },
    {
      tag: t.string,
      color: '#2AA198',
    },
    {
      tag: t.regexp,
      color: '#D30102',
    },
    {
      tag: t.number,
      color: '#D33682',
    },
    {
      tag: t.variableName,
      color: '#268BD2',
    },
    {
      tag: [t.keyword, t.operator, t.punctuation],
      color: '#859900',
    },
    {
      tag: [t.definitionKeyword, t.modifier],
      color: '#073642',
      fontWeight: 'bold',
    },
    {
      tag: [t.className, t.self, t.definition(t.propertyName)],
      color: '#268BD2',
    },
    {
      tag: t.function(t.variableName),
      color: '#268BD2',
    },
    {
      tag: [t.bool, t.null],
      color: '#B58900',
    },
    {
      tag: t.tagName,
      color: '#268BD2',
      fontWeight: 'bold',
    },
    {
      tag: t.angleBracket,
      color: '#93A1A1',
    },
    {
      tag: t.attributeName,
      color: '#93A1A1',
    },
    {
      tag: t.typeName,
      color: '#859900',
    },
  ],
}

export const espresso: ThemeOptions = {
  variant: 'light',
  settings: {
    background: '#FFFFCC',
    foreground: '#000000',
    caret: '#000000',
    selection: '#80C7FF',
    gutterBackground: '#FFFFFF',
    gutterForeground: '#00000070',
    lineHighlight: '#C1E2F8',
  },
  styles: [
    {
      tag: t.comment,
      color: '#AAAAAA',
    },
    {
      tag: [t.keyword, t.operator, t.typeName, t.tagName, t.propertyName],
      color: '#2F6F9F',
      fontWeight: 'bold',
    },
    {
      tag: [t.attributeName, t.definition(t.propertyName)],
      color: '#4F9FD0',
    },
    {
      tag: [t.className, t.string, t.special(t.brace)],
      color: '#CF4F5F',
    },
    {
      tag: t.number,
      color: '#CF4F5F',
      fontWeight: 'bold',
    },
    {
      tag: t.variableName,
      fontWeight: 'bold',
    },
  ],
}
