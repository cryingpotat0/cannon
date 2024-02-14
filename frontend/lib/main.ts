export { Cannon, getLanguageExtension } from './components/Cannon';
export { getTemplate } from './components/templates';
export { solarizedLight, birdsOfParadise, espresso, ayuLight, noctisLilac } from './components/create_theme';
export { Language } from './components/types';
export { createTheme } from './components/create_theme';

import Terminal from './components/XTerminal';
import Iframe from './components/Iframe';
import CodeEditor from './components/CodeEditor';
export { Terminal, Iframe, CodeEditor };

export { CannonProvider, useCannon } from './components/context';

// Re-export the theme type so callers can pass in a correc theme.
// Sample themes can be found in thememirror.
export type { ThemeOptions } from './components/create_theme';
