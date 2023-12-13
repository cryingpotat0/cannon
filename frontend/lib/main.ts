export { Cannon } from './components/Cannon';
export { getTemplate } from './components/templates';
export { solarizedLight, birdsOfParadise, espresso, ayuLight, noctisLilac } from './components/create_theme';
export { Language } from './components/types';

// Re-export the theme type so callers can pass in a correc theme.
// Sample themes can be found in thememirror.
export type { ThemeOptions } from './components/create_theme';
