import CodeEditor from './CodeEditor';
import Terminal, { TerminalConfig } from './Terminal';

import { ViewUpdate } from '@codemirror/view';
import { useState, MouseEvent, useEffect, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import './cannon.css';
import { createTheme, solarizedLight, ThemeOptions } from './create_theme';
import { ClientOptions, SandboxSetup, SandpackBundlerFiles, SandpackClient, loadSandpackClient } from '@codesandbox/sandpack-client';
import { Extension } from '@codemirror/state';
import { rust } from '@codemirror/lang-rust';
// import { javascript } from '@codemirror/lang-javascript';

export enum Language {
  Rust = 'rust',
  Javascript = 'javascript',
  Go = 'go',
  MaelstromGo = 'maelstrom_go',
}

// DiscriminatedUnion for specific per language props.
export type LanguageProps = {
  language: Language.Rust,
  runnerUrl: string,
} | {
  language: Language.Javascript,
  iframe: HTMLIFrameElement,
} | {
  language: Language.Go,
  runnerUrl: string,
} | {
  language: Language.MaelstromGo,
  runnerUrl: string,
};

// This duplication is ugly, figure out a better way to do this.
type LanguageInitializationResources = {
  language: Language.Rust
  state: 'initialized',
  runnerUrl: string,
} | {
  language: Language.Javascript,
  client: SandpackClient
  state: 'initialized',
} | {
  language: undefined,
  state: 'destroyed',
} | {
  language: Language.Go,
  state: 'initialized',
  runnerUrl: string,
} | {
  language: Language.MaelstromGo,
  state: 'initialized',
  runnerUrl: string,
};


export type CannonProps = {
  initialFiles: Record<string, string>,
  languageProps: LanguageProps,
  initialOutput?: string,
  editorTheme?: ThemeOptions,
  viewerTheme?: ThemeOptions,
  onEditorUpdate?: ({ currentTab, update }: { currentTab: string, update: ViewUpdate }) => void,
  terminalConfig?: TerminalConfig,
}


const filesForSandpack = (files: Record<string, string>): SandpackBundlerFiles => {
  return Object.entries(files).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: {
        code: value,
      },
    };
  }, {});
}

const getLanguageExtension = (language: Language): Extension => {
  switch (language) {
    case Language.Rust: {
      return rust();
    }
    case Language.Javascript: {
      // TODO: The javascript extension seems to break rerunning the code? Very weird.
      return rust();
    }
    case Language.Go: {
      // err I can't find the go package
      return rust();
    }
    case Language.MaelstromGo: {
      // err I can't find the go package
      return rust();
    }
    default:
      throw new Error(`Language ${language} not supported`);
  }
}


const startRunner = async ({
  runnerUrl,
  filesRef,
  language,
  setData,
  onError,
}: {
  runnerUrl: string
  filesRef: MutableRefObject<Record<string, string>>,
  language: Language,
  setData(value: SetStateAction<string[]>): void,
  onError(error: any): void,
}) => {
  try {
    const response = await fetch(runnerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: filesRef.current,
        language,
      }),
    });
    const reader = response.body?.getReader();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      setData(prevData => [...prevData, text]);
    }
  } catch (error: any) {
    onError(error);
  }
}

const onRunGenerator = (
  {
    languageInitializationResources,
    filesRef,
    setData,
    setIsLoading
  }: {
    languageInitializationResources: MutableRefObject<LanguageInitializationResources | undefined>,
    filesRef: MutableRefObject<Record<string, string>>,
    setData: Dispatch<SetStateAction<string[]>>,
    setIsLoading: Dispatch<SetStateAction<boolean>>,

  }) => {
  if (!languageInitializationResources.current) {
  }

  // console.log('2. onRunGenerator', languageInitializationResources.current);


  return async (_event: MouseEvent) => {
    setIsLoading(true);
    setData([]);
    if (!languageInitializationResources.current) throw new Error('languageInitializationResources not defined');
    const { language } = languageInitializationResources.current;
    switch (language) {
      case 'javascript': {
        const { client } = languageInitializationResources.current;
        // console.log('3. updating sandbox', filesRef.current);
        client.updateSandbox({
          files: filesForSandpack(filesRef.current),
        });
        break;
      }
      // All server runners have similar logic.
      case 'rust':
      case 'maelstrom_go':
      case 'go': {
        const { runnerUrl } = languageInitializationResources.current;
        // console.log('3. starting runner', runnerUrl, filesRef.current);
        await startRunner({
          runnerUrl,
          filesRef,
          language,
          setData,
          // TODO: better onerror handling
          onError: (error) => {
            setData([error.toString().split('\n')]);
          },
        });
        break;
      }
      default:
        throw new Error(`Language ${language} not supported`);
    }
    setIsLoading(false);
  }
};

export function Cannon({
  languageProps,
  initialFiles,
  initialOutput,
  editorTheme,
  viewerTheme,
  onEditorUpdate,
  terminalConfig,
}: CannonProps) {

  editorTheme ??= solarizedLight;
  viewerTheme ??= solarizedLight;

  const [data, setData] = useState<string[]>(initialOutput ? [initialOutput] : []);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const filesRef = useRef(files);
  const languageInitializationResources = useRef<LanguageInitializationResources>();

  useEffect(() => {
    if (languageInitializationResources.current?.state === 'initialized') return;
    (async () => {
      const { language } = languageProps;
      switch (language) {
        case Language.Rust: {
          languageInitializationResources.current = {
            runnerUrl: languageProps.runnerUrl,
            state: 'initialized',
            language: Language.Rust,
          };
          break;
        }
        case Language.Go: {
          languageInitializationResources.current = {
            runnerUrl: languageProps.runnerUrl,
            state: 'initialized',
            language: Language.Go,
          };
          break;
        }
        case Language.MaelstromGo: {
          languageInitializationResources.current = {
            runnerUrl: languageProps.runnerUrl,
            state: 'initialized',
            language: Language.MaelstromGo,
          };
          break;
        }
        case Language.Javascript: {
          const { iframe } = languageProps;
          if (!iframe) throw new Error('iframe not defined');
          const content: SandboxSetup = {
            entry: "/index.js",
            files: filesForSandpack(filesRef.current),
            template: "create-react-app",
          };

          // Optional options
          const options: ClientOptions = {
            // logLevel: SandpackLogLevel.Debug
            showOpenInCodeSandbox: false,
            // clearConsoleOnFirstCompile: true,

            // TODO: understand why this is needed. 
            // then do the plumbing to pass it from up there.
            externalResources: ["https://cdn.tailwindcss.com"],
          };

          const client = await loadSandpackClient(
            iframe,
            content,
            options)
          client.listen((msg) => {
            // console.log('update', client.status, msg);
            if (msg.type === "console") {
              const logs = msg.log.flatMap(({ data }) => data + '\n');
              setData(prevData => [...prevData, ...logs]);
            }
          });

          languageInitializationResources.current = {
            language: Language.Javascript,
            client,
            state: 'initialized',
          };

          break;
        }
        default:
          throw new Error(`Language ${language} not supported`);
      }
    })();

    return () => {
      // console.log('4. unmounting');
      switch (languageInitializationResources.current?.language) {
        case Language.Javascript: {
          const { client } = languageInitializationResources.current;
          // console.log('5. destroying client', client);
          client.destroy();
          break;
        }
      };
      languageInitializationResources.current = {
        state: 'destroyed',
        language: undefined,
      };
    }
  }, [languageProps]);


  // useEffect(() => {
  //   console.log('languageInitializationResources changed', languageInitializationResources.current);
  // }, [languageProps]);



  const onRun = onRunGenerator({
    languageInitializationResources,
    filesRef,
    setData,
    setIsLoading,
  });

  useEffect(() => {
    filesRef.current = files;
    // console.log('files changed', files);
  }, [files]);


  const editorExtensions = [getLanguageExtension(languageProps.language), createTheme(editorTheme),];
  const viewerExtensions = [createTheme(viewerTheme)];

  return (
    <>
      <CodeEditor
        files={files}
        setFiles={setFiles}
        extensions={editorExtensions}
        onUpdate={onEditorUpdate}
      />
      <Terminal
        data={data}
        extensions={viewerExtensions}
        onRun={onRun}
        isLoading={isLoading}
        config={terminalConfig}
      />
    </>
  )
}
