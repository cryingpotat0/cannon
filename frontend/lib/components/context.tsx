import { useState, createContext, useEffect, useContext, } from 'react';
import { CannonContextType, CannonProviderProps, Language, RunnerInformation, CannonStatus, CannonEventName, CannonEventListenerFn, CannonEvent, Highlight, Focus, CannonFiles, assertUnreachable } from './types';
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
    [CannonEventName.reset]: [],
  });

  // Validate focus
  if (initialFocus) {
    if (!files[initialFocus.filePath]) {
      throw new Error(`Focus file ${initialFocus.filePath} does not exist`);
    }
  }
  const [focus, setFocus] = useState<Focus>(initialFocus || { filePath: Object.keys(files)[0] });
  const [highlights, setHighlights] = useState<Highlight[] | undefined>(initialHighlights);

  useEffect(() => {
    if (!event) return;
    for (const listener of listeners[event.name]) {
      listener(event);
    }
  }, [event]);

  useEffect(() => {
    // Remove highlights for dirty files.
    if (!highlights) return;
    const newHighlights = highlights.filter(highlight => {
      return !files[highlight.filePath].dirty;
    });
    if (newHighlights.length === highlights.length) return;
    setHighlights(newHighlights);
  }, [files]);

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

        let { runCommand } = languageProps;
        if (!runCommand) {
          runCommand = {
            command: 'npm',
            args: ['run', 'start'],
          };
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

          const startProcess = await webcontainerInstance.spawn(runCommand.command, runCommand.args, {
            env: runCommand.env,
          });
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
      case Language.Pyoidide:
        (async () => {
          // @ts-ignore
          if (!window.loadPyodide) {
            console.log("adding pyodide script tag");
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              document.body.appendChild(script);
              script.onload = resolve;
              script.onerror = reject;
              script.async = true;
              script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            })
          }

          setCannonStatus(CannonStatus.Ready)
          setRunner({
            language,
            // @ts-ignore
            client: await window.loadPyodide({
              fullStdLib: true,
              stdout: (text: string) => {
                setOutput(prevOutput => `${prevOutput}${text}`);
                setEvent({
                  name: CannonEventName.output,
                  data: text,
                });
              },
              stderr: (text: string) => {
                setOutput(prevOutput => `${prevOutput}${text}`);
                setEvent({
                  name: CannonEventName.output,
                  data: text,
                });
              }
            }),
          });

        })();


        // TODO: pyodide
        break
      default:
        // Exhaustive match in typescript!!
        assertUnreachable(language);
    }
    return () => {
      destroyed = true;
      if (webcontainerInstance) {
        // We can't tear down the webcontainer instance because tehre migh tbe multiple codeblocks on the page :/
        // webcontainerInstance.teardown();
        // webcontainerInstance = undefined;
      }
    }
  }, [languageProps]);

  if (!runner || cannonStatus === CannonStatus.Unintialized) {
    const noRunnerHandler = () => {
      throw new Error('No runner');
    };
    <Cannon.Provider value={{
      runner: undefined,
      output: "",
      cannonStatus: CannonStatus.Unintialized,
      fileData: {
        files,
        highlights,
        focus,
      },
      commands: new Proxy({}, {
        get: noRunnerHandler,
      }) as CannonContextType['commands'],
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
          for (const [fileName, file] of Object.entries(files)) {
            if (!file.dirty) continue;
            await webcontainerInstance.fs.writeFile(fileName, file.content);
          }
          // Reset file dirty states.
          setFiles(prevFiles => {
            return Object.entries(prevFiles).reduce((a, [fileName, file]) => {
              a[fileName] = {
                ...file,
                dirty: false,
              };
              return a;
            }, {} as CannonFiles);
          });
          break;
        case Language.Pyoidide:
          // TODO: pyodide
          const pyodide = runner.client;
          if (Object.keys(files).length !== 1) throw new Error('Only one file is supported for pyodide');
          const [_, file] = Object.entries(files)[0];
          try {
            await pyodide.runPythonAsync(`
import sys
def reformat_exception():
    from traceback import format_exception
    # Format a modified exception here
    # this just prints it normally but you could for instance filter some frames
    return "".join(
        format_exception(sys.last_type, sys.last_value, sys.last_traceback)
    )
`);
            await pyodide.runPythonAsync(file.content);
          } catch (e: any) {
            let reformat_exception = pyodide.globals.get("reformat_exception");
            const formatted: string = reformat_exception();

            setOutput(formatted);
            setEvent({
              name: CannonEventName.output,
              data: formatted,
            });

            // We should be outputting things as individual lines in keeping with teh API.
            // Well its actually not clear what the API is.
            // Either way, need to fix this. setEvent doesn't work for many events.
            // const formattedArr = formatted.split('\n');
            // for (const line of formattedArr) {
            //   console.log(line);
            //   setOutput(prevData => `${prevData}${line}\n`);
            //   setEvent({
            //     name: CannonEventName.output,
            //     data: line,
            //   });
            // }
          }
          // console.log('output', output);
          // setOutput(output);
          // setEvent({
          //   name: CannonEventName.output,
          //   data: output,
          // });
          break;
        default:
          assertUnreachable(language);
      }
      console.log('done running');
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
        setHighlights: (arg) => {
          setHighlights(arg(highlights || []));
        },
        changeFocus: (newFocus) => {
          setFocus(newFocus);
        },
        reset: () => {
          setOutput("");
          setEvent({
            name: CannonEventName.output,
            data: "",
            clear: true,
          });
          setFocus(initialFocus || { filePath: Object.keys(initialFiles)[0] });
          setFiles(
            Object.entries(initialFiles).reduce((a, b) => {
              a[b[0]] = {
                content: b[1],
                // We need to set everything to dirty until we finish running.
                dirty: true,
              };
              return a;
            }, {} as CannonFiles));
          setCannonStatus(cannonStatus => {
            // TODO: this could lead to weird behavior when reset in the
            // middle of running.
            if (cannonStatus === CannonStatus.Running) return CannonStatus.Ready;
            return CannonStatus.Running;
          });
          setLanguageProps(initialLanguageProps);
          setHighlights(initialHighlights);
          setEvent({
            name: CannonEventName.reset,
          });
        }
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

