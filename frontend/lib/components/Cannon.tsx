import CodeEditor from './CodeEditor';
// import Terminal from './Terminal';
import XTerminal from './XTerminal';

import { StreamLanguage } from "@codemirror/language"
import { go } from "@codemirror/legacy-modes/mode/go"
import { createTheme, solarizedLight } from './create_theme';
import { Extension } from '@codemirror/state';
import { rust } from '@codemirror/lang-rust';
import { CannonProps, Language } from './types';
import { CannonProvider } from './context';
import { javascript } from '@codemirror/lang-javascript';

export const getLanguageExtension = (language: Language): Extension => {
  switch (language) {
    case Language.Rust: {
      return rust();
    }
    case Language.Javascript: {
      // TODO: The javascript extension seems to break rerunning the code? Very weird.
      return rust();
    }
    case Language.JavascriptWebContainer: {
      // TODO: The javascript extension seems to break rerunning the code? Very weird.
      return javascript();
    }
    case Language.Go: {
      return StreamLanguage.define(go);
    }
    case Language.MaelstromGo: {
      return StreamLanguage.define(go);
    }
    default:
      throw new Error(`Language ${language} not supported`);
  }
}

export function Cannon({
  languageProps,
  files,
  output,
  editorTheme,
  viewerTheme,
  onEditorUpdate,
  terminalConfig,
}: CannonProps) {

  editorTheme ??= solarizedLight;
  viewerTheme ??= solarizedLight;


  const editorExtensions = [getLanguageExtension(languageProps.language), createTheme(editorTheme),];

  return (
    <CannonProvider
      languageProps={languageProps}
      files={files}
      output={output}
    >
      <CodeEditor
        extensions={editorExtensions}
        onUpdate={onEditorUpdate}
      />
      <XTerminal
        config={{
          ...terminalConfig,
          theme: viewerTheme,
        }}
      />
    </CannonProvider>
  )
}
