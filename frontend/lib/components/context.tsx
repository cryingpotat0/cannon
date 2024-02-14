import { useState, createContext, useEffect, useContext, } from 'react';
import { CannonContextType, CannonProviderProps, Language, RunnerInformation, CannonStatus, CannonEventName, CannonEventListenerFn, CannonEvent, Highlight, Focus, CannonFiles } from './types';
import { SandboxSetup, loadSandpackClient } from '@codesandbox/sandpack-client';
import { WebContainer } from "@webcontainer/api";
import { filesToWebcontainerFiles, filesForSandpack } from './utils';

const Cannon = createContext<CannonContextType | null>(null);

export const CannonProvider: React.FC<CannonProviderProps> = ({
  languageProps: initialLanguageProps,
  children,
  files: initialFiles,
  output: initialOutput,
  onRun,
  focus: initialFocus,
  highlights: initialHighlights,
}: CannonProviderProps) => {
  const [runner, setRunner] = useState<RunnerInformation | undefined>(undefined);
  const [cannonStatus, setCannonStatus] = useState<CannonStatus>(CannonStatus.Unintialized);
  const [output, setOutput] = useState<string>(initialOutput || "");
  const [event, setEvent] = useState<CannonEvent | undefined>(undefined);
  const [files, setFiles] = useState<CannonFiles>(Object.entries(initialFiles).reduce((a, b) => {
    a[b[0]] = {
      content: b[1],
      dirty: false,
    };
    return a;
  }, {} as CannonFiles));
  const [languageProps, setLanguageProps] = useState(initialLanguageProps);
  const [listeners, setListeners] = useState<Record<CannonEventName, CannonEventListenerFn[]>>({
    [CannonEventName.output]: [],
  });
  const [focus, setFocus] = useState<Focus>(initialFocus || { filePath: Object.keys(files)[0] });
  const [highlights, setHighlights] = useState<Highlight[] | undefined>(initialHighlights);

  useEffect(() => {
    if (!event) return;
    for (const listener of listeners[event.name]) {
      listener(event);
    }
  }, [event]);

  useEffect(() => {
    if (cannonStatus !== CannonStatus.Unintialized) return;
    const { language } = languageProps;
    let destroyed = false;
    let webcontainerInstance: WebContainer | undefined = undefined;
    switch (language) {
      case Language.Rust:
      case Language.Go:
      case Language.MaelstromGo:
        const { runnerUrl, command, options } = languageProps;
        setCannonStatus(CannonStatus.Ready)
        setRunner({
          language,
          runnerUrl,
          command,
          options,
        });
        break;
      case Language.Javascript:
        const { iframe, options: jsOptions } = languageProps;
        if (!iframe) {
          // Language props will be updated when the iframe is ready.
          return;
        }
        (async () => {
          const content: SandboxSetup = {
            entry: "/index.js",
            files: filesForSandpack(files),
          };

          const client = await loadSandpackClient(
            iframe,
            content,
            {
              showOpenInCodeSandbox: false,
              // TODO: understand why we need externalResources.
              externalResources: jsOptions?.externalResources || ["https://cdn.tailwindcss.com"],
              bundlerURL: jsOptions?.bundlerURL,
              // bundlerURL: 'http://127.0.0.1:9000/www',
              // bundlerURL: 'https://sandpack-bundler.codesandbox.io/',
              // reactDevTools: 'latest',
            }
          );
          client.listen((msg) => {
            if (msg.type === "console") {
              const logs = msg.log.flatMap(({ data }) => data + '\n');
              const text = logs.join('');
              setOutput(prevOutput => `${prevOutput}${text}`);
              setEvent({
                name: CannonEventName.output,
                data: text,
              });
            } else {
            }
          });

          if (!destroyed && cannonStatus === CannonStatus.Unintialized) {
            setCannonStatus(CannonStatus.Ready)
            setRunner({
              language,
              client,
            });
          } else {
            // destroy the client if we're no longer using it.
            client.destroy();
          }
        })();
        break;
      case Language.JavascriptWebContainer:
        const { iframe: wcIframe } = languageProps;
        if (!wcIframe) {
          // Language props will be updated when the iframe is ready.
          return;
        }
        (async () => {
          if (!webcontainerInstance) {
            try {
              webcontainerInstance = await WebContainer.boot();
            } catch (e) {
              console.error('Unable to boot webcontainer', e);
              return;
            }
          }
          const webcontainerFiles = filesToWebcontainerFiles(files);
          await webcontainerInstance?.mount(webcontainerFiles);
          const installProcess = await webcontainerInstance?.spawn('npm', ['install']);
          installProcess.output.pipeTo(new WritableStream({
            write(text) {
              setOutput(prevOutput => `${prevOutput}${text}`);
              setEvent({
                name: CannonEventName.output,
                data: text,
              });
            }
          }));


          const installExitCode = await installProcess.exit;

          if (installExitCode !== 0) {
            throw new Error(`Unable to run npm install ${output}`);
          }

          const startProcess = await webcontainerInstance.spawn('npm', ['run', 'start']);
          startProcess.output.pipeTo(new WritableStream({
            write(text) {
              setOutput(prevOutput => `${prevOutput}${text}`);
              setEvent({
                name: CannonEventName.output,
                data: text,
              });
            }
          }));

          console.log('waiting for server-ready');
          webcontainerInstance.on('error', (err) => {
            console.error('webcontainer error', err);
          });
          const iframeUrl = await new Promise<string>(resolve => {
            webcontainerInstance!.on('server-ready', (port, url) => {
              console.log(`Server ready on port ${port} and url ${url}`);
              resolve(url);
            });
          });

          wcIframe.src = iframeUrl;

          if (cannonStatus === CannonStatus.Unintialized) {
            setCannonStatus(CannonStatus.Ready)
            setRunner({
              language,
              client: webcontainerInstance,
            });
          } else {
          }
        })();
        break;
    }
    return () => {
      destroyed = true;
      if (webcontainerInstance) {
        // webcontainerInstance.teardown();
        // webcontainerInstance = undefined;
      }
    }
  }, [languageProps]);

  if (!runner || cannonStatus === CannonStatus.Unintialized) {
    <Cannon.Provider value={{
      runner: undefined,
      output: "",
      cannonStatus: CannonStatus.Unintialized,
      fileData: {
        files,
        highlights,
        focus,
      },
      commands: {
        updateFile: () => {
          throw new Error('No runner');
        },
        updateLanguageProps: () => {
          throw new Error('No runner');
        },
        run: () => {
          throw new Error('No runner');
        },
        on: () => {
          throw new Error('No runner');
        },
        addHighlight: () => {
          throw new Error('No runner');
        },
        changeFocus: () => {
          throw new Error('No runner');
        },
      },
    }}>
      {children}
    </Cannon.Provider>
  }


  useEffect(() => {
    if (cannonStatus !== CannonStatus.Running) return;
    const postRunEffect = async () => {
      setOutput("");
      setEvent({
        name: CannonEventName.output,
        data: "",
        clear: true,
      });
      if (!runner) throw new Error('No runner');
      const { language } = runner;
      switch (language) {
        case Language.Rust:
        case Language.Go:
        case Language.MaelstromGo:
          const { runnerUrl, command, options } = runner;
          console.log('using runner options ', options);
          try {
            const headers: Headers = new Headers();
            headers.append('Accept', 'application/json');
            headers.append('Content-Type', 'application/json');
            if (options?.disableCache) {
              headers.append('Cache-Control', 'no-cache');
            }

            // TODO: statically match this type to the runner input type using openapi.
            const requestBody: any = {
              files,
              command,
              language,
            };
            if (options?.imageBuilder) {
              requestBody.image_build_args = options.imageBuilder;
            }

            const response = await fetch(runnerUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody),
            });
            const reader = response.body?.getReader();
            while (reader) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = new TextDecoder().decode(value);
              setOutput(prevData => `${prevData}${text}`);
              setEvent({
                name: CannonEventName.output,
                data: text,
              });
            }
          } catch (e: any) {
            // TODO: set output on event, no need to set it up individually.
            setOutput(e.toString());
            setEvent({
              name: CannonEventName.output,
              data: e.toString(),
            });
          }
          break;

        case Language.Javascript:
          const { client } = runner;
          client.updateSandbox({
            files: filesForSandpack(files),
          });
          await new Promise(resolve => client.listen(msg => {
            if (msg.type === 'done') {
              resolve(undefined);
            }
          }));
          // TODO: plumb sandpack updates
          break;
        case Language.JavascriptWebContainer:
          const { client: webcontainerInstance } = runner;
          // TODO: don't mount the whole directory, track dirty and only update files as necessary.
          await webcontainerInstance.mount(filesToWebcontainerFiles(files));
          if (languageProps.language === Language.JavascriptWebContainer) {
            languageProps.iframe?.contentWindow?.location.reload();
          }
      }
      setCannonStatus(CannonStatus.Ready);

      // Trigger event handler.
      onRun?.();
    };
    postRunEffect();
  }, [cannonStatus]);

  return (
    <Cannon.Provider value={{
      runner,
      output,
      cannonStatus,
      fileData: {
        files,
        highlights,
        focus,
      },
      commands: {
        updateFile: ({ fileName, content }) => {
          setFiles(prevFiles => ({
            ...prevFiles,
            [fileName]: {
              content,
              dirty: true,
            },
          }));
        },
        updateLanguageProps: (updateFn) => {
          setLanguageProps(updateFn(languageProps));
        },
        run(): void {
          setCannonStatus(cannonStatus => {
            if (cannonStatus === CannonStatus.Running) throw new Error('Already running');
            return CannonStatus.Running;
          });
        },
        on: (eventName, listener) => {
          setListeners(prevListeners => {
            const existingListeners = prevListeners[eventName] || [];
            return {
              ...prevListeners,
              [eventName]: [...existingListeners, listener],
            };
          });
          return {
            dispose: () => {
              setListeners(prevListeners => {
                const existingListeners = prevListeners[eventName] || [];
                const newListeners = existingListeners.filter(l => l !== listener);
                return {
                  ...prevListeners,
                  [eventName]: newListeners,
                };
              });
            }
          };
        },
        addHighlight: (highlight) => {
          setHighlights(prevHighlights => {
            if (!prevHighlights) return [highlight];
            return [...prevHighlights, highlight];
          });
        },
        changeFocus: (newFocus) => {
          setFocus(newFocus);
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

