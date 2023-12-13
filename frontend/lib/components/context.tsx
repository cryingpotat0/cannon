import { useState, createContext, useEffect, useContext, useRef } from 'react';
import { CannonContextType, CannonProviderProps, Language, RunnerInformation, CannonStatus } from './types';
import { SandboxSetup, loadSandpackClient } from '@codesandbox/sandpack-client';

const Cannon = createContext<CannonContextType | null>(null);

export const CannonProvider: React.FC<CannonProviderProps> = ({
  languageProps,
  children,
  files: initialFiles,
  output: initialOutput,
}: CannonProviderProps) => {
  const [_runner, setRunner] = useState<RunnerInformation | undefined>(undefined);
  const runner = useRef<RunnerInformation | undefined>(_runner);
  const [_cannonStatus, setCannonStatus] = useState<CannonStatus>(CannonStatus.Unintialized);
  const cannonStatus = useRef<CannonStatus>(_cannonStatus);
  const [_output, setOutput] = useState<string>(initialOutput || "");
  const output = useRef<string>(_output);

  useEffect(() => {
    runner.current = _runner;
    cannonStatus.current = _cannonStatus;
    output.current = _output;
    console.log('runner.current', runner.current);
  }, [_runner, _cannonStatus, _output]);

  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(files)[0]);

  useEffect(() => {
    if (cannonStatus.current !== CannonStatus.Unintialized) return;
    const { language } = languageProps;
    let destroyed = false;
    switch (language) {
      case Language.Rust:
      case Language.Go:
      case Language.MaelstromGo:
        console.log('setting runner');
        const { runnerUrl, command } = languageProps;
        setRunner({
          language,
          runnerUrl,
          command,
        });
        setCannonStatus(CannonStatus.Ready)
        break;
      case Language.Javascript:
        const { iframe } = languageProps;
        (async () => {
          const content: SandboxSetup = {
            entry: "/index.js",
            files: Object.entries(files).reduce((acc, [key, value]) => {
              return {
                ...acc,
                [key]: {
                  code: value,
                },
              };
            }, {})
          };

          const client = await loadSandpackClient(
            iframe,
            content,
            {
              showOpenInCodeSandbox: false,
              // TODO: understand why we need externalResources.
              externalResources: ["https://cdn.tailwindcss.com"],
            }
          );
          client.listen((msg) => {
            if (msg.type === "console") {
              const logs = msg.log.flatMap(({ data }) => data + '\n');
              const text = logs.join('');
              setOutput(prevOutput => `${prevOutput}${text}`);
            }
          });

          if (!destroyed && cannonStatus.current === CannonStatus.Unintialized) {
            setCannonStatus(CannonStatus.Ready)
            setRunner({
              language,
              client,
            });
          }
        })();
    }
    return () => {
      destroyed = true;
    }
  }, []);

  return (
    <Cannon.Provider value={{
      runner: runner.current,
      output: output.current,
      cannonStatus: cannonStatus.current,
      fileData: {
        activeFile,
        files,
      },
      commands: {
        updateFile: ({ fileName, content }) => {
          setFiles(prevFiles => ({
            ...prevFiles,
            [fileName]: content,
          }));
        },
        updateActiveFile: ({ fileName }) => {
          setActiveFile(fileName);
        },

        async run(): Promise<void> {
          if (cannonStatus.current === CannonStatus.Running) throw new Error('Already running');
          if (!runner.current) throw new Error('No runner');
          setCannonStatus(CannonStatus.Running);
          setOutput("");
          const { language } = runner.current;
          switch (language) {
            case Language.Rust:
            case Language.Go:
            case Language.MaelstromGo:
              const { runnerUrl, command } = runner.current;
              try {
                const response = await fetch(runnerUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    // TODO: remove disables the modal cache.
                    // 'Cache-Control': 'no-cache',
                  },
                  body: JSON.stringify({
                    files,
                    command,
                    language,
                  }),
                });
                const reader = response.body?.getReader();
                while (reader) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const text = new TextDecoder().decode(value);
                  setOutput(prevData => `${prevData}${text}`);
                }
              } catch (e: any) {
                setOutput(e.toString());
              }
              break;

            case Language.Javascript:
              // TODO: plumb sandpack updates
              break;
          }
          setCannonStatus(CannonStatus.Ready);
        },
      },
    }}>
      {children}
    </Cannon.Provider>
  )
};


export const useCannon = (): CannonContextType => {
  const cannon = useContext(Cannon);
  if (!cannon) {
    throw new Error('useCannon must be used within a CannonProvider');
  }
  return cannon;
}

