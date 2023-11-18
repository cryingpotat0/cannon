import { Cannon, ThemeOptions } from '../lib/main';
import { tags as t } from '@lezer/highlight';
const birdsOfParadise: ThemeOptions = {
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
};

const solarizedLight: ThemeOptions = {
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

function App() {
  return (
    <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
      <Cannon
        initialFiles={{
          'src/main.rs': `fn main() {
  println!("Hello, world!");
}`,
          'Cargo.toml': `[package]
name = "hello_world"
version = "0.1.0"
edition = "2021"`
        }}
        editorTheme={birdsOfParadise}
        viewerTheme={solarizedLight}
      />
    </div>
  )
}

export default App
