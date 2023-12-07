export { Cannon, Language } from './components/Cannon';
export { getTemplate } from './components/templates';
export { solarizedLight, birdsOfParadise, espresso, ayuLight, noctisLilac } from './components/create_theme';

// Re-export the theme type so callers can pass in a correc theme.
// Sample themes can be found in thememirror.
export type { ThemeOptions } from './components/create_theme';
