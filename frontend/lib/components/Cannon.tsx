import CodeEditor from './CodeEditor';
import Terminal from './Terminal';

import { useState, MouseEvent, useEffect, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import './cannon.css';
import { createTheme, solarizedLight, birdsOfParadise, ThemeOptions } from './create_theme';
import { ClientOptions, SandboxSetup, SandpackBundlerFiles, SandpackClient, loadSandpackClient } from '@codesandbox/sandpack-client';

export enum Language {
  Rust = 'rust',
  Javascript = 'javascript',
}

// DiscriminatedUnion for specific per language props.
export type LanguageProps = {
  language: Language.Rust,
} | {
  language: Language.Javascript,
  iframe: HTMLIFrameElement,
};

type LanguageInitializationResources = {
  language: Language.Rust
  state: 'initialized',
} | {
  language: Language.Javascript,
  client: SandpackClient
  state: 'initialized',
} | {
  language: undefined,
  state: 'destroyed',
};


export type CannonProps = {
  initialFiles: Record<string, string>,
  languageProps: LanguageProps,
  initialOutput?: string,
  editorTheme?: ThemeOptions,
  viewerTheme?: ThemeOptions,
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


  return async (_event: MouseEvent) => {
    setIsLoading(true);
    setData([]);
    if (!languageInitializationResources.current) throw new Error('languageInitializationResources not defined');
    const { language } = languageInitializationResources.current;
    switch (language) {
      case 'javascript': {
        const { client } = languageInitializationResources.current;
        client.updateSandbox({
          files: filesForSandpack(filesRef.current),
        });
        break;
      }
      case 'rust': {
        const runRustUrl = 'https://cryingpotat0--allpack-runners-rust-run.modal.run';
        const response = await fetch(runRustUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: filesRef.current,
          }),
        });
        const reader = response.body?.getReader();
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          setData(prevData => [...prevData, text]);
        }
        break;
      }
      default:
        throw new Error(`Language ${language} not supported`);
    }
    setIsLoading(false);
  }
};

const initialCodeExtractor = (language: Language, initialFiles: Record<string, string>): string => {
  switch (language) {
    case 'rust': {
      return initialFiles['src/main.rs'];
    }
    case 'javascript': {
      return initialFiles['/src/App.js'];
    }
    default:
      throw new Error(`Language ${language} not supported`);
  }
}

const setCodeGenerator = (language: Language, setFiles: Dispatch<SetStateAction<Record<string, string>>>) => {
  return (code: string) => {
    switch (language) {
      case 'rust': {
        setFiles(prevFiles => ({
          ...prevFiles,
          'src/main.rs': code,
        }));
        break;
      }
      case 'javascript': {
        setFiles(prevFiles => ({
          ...prevFiles,
          '/src/App.js': code,
        }));
        break;
      }
      default:
        throw new Error(`Language ${language} not supported`);
    }
  }
}


export function Cannon({
  languageProps,
  initialFiles,
  initialOutput,
  editorTheme,
  viewerTheme,
}: CannonProps) {

  const [data, setData] = useState<string[]>(initialOutput ? [initialOutput] : []);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const filesRef = useRef(files);
  const languageInitializationResources = useRef<LanguageInitializationResources>();

  useEffect(() => {
    if (languageInitializationResources.current) return;
    (async () => {
      const { language } = languageProps;
      switch (language) {
        case Language.Rust: {
          languageInitializationResources.current = {
            state: 'initialized',
            language: Language.Rust,
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
          };

          const client = await loadSandpackClient(
            iframe,
            content,
            options)
          client.listen((msg) => {
            console.log('update', client.status, msg);
          });
          // console.log('3. running languageInitializationResource useEffect async', languageProps.language, client, languageInitializationResources);

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
      console.log('4. unmounting');
      switch (languageInitializationResources.current?.language) {
        case Language.Javascript: {
          const { client } = languageInitializationResources.current;
          console.log('5. destroying client', client);
          client.destroy();
          break;
        }
      };
      languageInitializationResources.current = {
        language: undefined,
        state: 'destroyed',
      };
    }
  }, []);


  const onRun = onRunGenerator({
    languageInitializationResources,
    filesRef,
    setData,
    setIsLoading,
  });

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const setCode = setCodeGenerator(languageProps.language, setFiles);
  const initialCode = initialCodeExtractor(languageProps.language, initialFiles);

  const editorExtensions = editorTheme ? [createTheme(editorTheme)] : [createTheme(birdsOfParadise)];
  const viewerExtensions = viewerTheme ? [createTheme(viewerTheme)] : [createTheme(solarizedLight)];

  return (
    <>
      <CodeEditor
        code={initialCode}
        setCode={setCode}
        extensions={editorExtensions}
      />
      <Terminal
        data={data}
        extensions={viewerExtensions}
        onRun={onRun}
        isLoading={isLoading}
      />
    </>
  )
}
