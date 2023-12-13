import { useState, createContext, useEffect, useContext, } from 'react';
import { CannonContextType, CannonProviderProps, Language, RunnerInformation, CannonStatus } from './types';
import { SandboxSetup, loadSandpackClient } from '@codesandbox/sandpack-client';

const Cannon = createContext<CannonContextType | null>(null);

export const CannonProvider: React.FC<CannonProviderProps> = ({
  languageProps,
  children,
  files: initialFiles,
  output: initialOutput,
}: CannonProviderProps) => {
  const [runner, setRunner] = useState<RunnerInformation | undefined>(undefined);
  // const runner = useRef<RunnerInformation | undefined>(_runner);
  const [cannonStatus, setCannonStatus] = useState<CannonStatus>(CannonStatus.Unintialized);
  // const cannonStatus = useRef<CannonStatus>(_cannonStatus);
  const [output, setOutput] = useState<string>(initialOutput || "");
  // const output = useRef<string>(_output);


  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(files)[0]);

  useEffect(() => {
    if (cannonStatus !== CannonStatus.Unintialized) return;
    const { language } = languageProps;
    let destroyed = false;
    switch (language) {
      case Language.Rust:
      case Language.Go:
      case Language.MaelstromGo:
        console.log('setting runner');
        const { runnerUrl, command } = languageProps;
        setCannonStatus(CannonStatus.Ready)
        setRunner({
          language,
          runnerUrl,
          command,
        });
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

          if (!destroyed && cannonStatus === CannonStatus.Unintialized) {
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

  if (!runner || cannonStatus === CannonStatus.Unintialized) {
    <Cannon.Provider value={{
      runner: undefined,
      output: "",
      cannonStatus: CannonStatus.Unintialized,
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
        run: () => {
          throw new Error('No runner');
        }
      },
    }}>
      {children}
    </Cannon.Provider>
  }


  useEffect(() => {
    if (cannonStatus !== CannonStatus.Running) return;
    console.log('Running post run effect', cannonStatus);
    const postRunEffect = async () => {
      setOutput("");
      if (!runner) throw new Error('No runner');
      const { language } = runner;
      switch (language) {
        case Language.Rust:
        case Language.Go:
        case Language.MaelstromGo:
          const { runnerUrl, command } = runner;
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
    };
    postRunEffect();
  }, [cannonStatus]);

  return (
    <Cannon.Provider value={{
      runner,
      output,
      cannonStatus,
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

        run(): void {
          setCannonStatus(cannonStatus => {
            console.log('some mofo calling me');
            if (cannonStatus === CannonStatus.Running) throw new Error('Already running');
            return CannonStatus.Running;
          });
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

