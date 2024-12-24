import { useState, createContext, useEffect, useContext, } from 'react';
import { CannonContextType, CannonProviderProps, Language, RunnerInformation, CannonStatus, CannonEventName, CannonEventListenerFn, CannonEvent, Highlight, Focus, CannonFiles, assertUnreachable, ResetOptions, CannonSerializedProps, LanguageProps } from './types';
import { SandboxSetup, loadSandpackClient } from '@codesandbox/sandpack-client';
import { WebContainer } from "@webcontainer/api";
import { filesToWebcontainerFiles, filesForSandpack } from './utils';
import { getTemplate } from './templates';

const Cannon = createContext<CannonContextType | null>(null);


export const CannonProvider: React.FC<CannonProviderProps> = ({
    languageProps: initialLanguageProps,
    children,
    files: initialFiles,
    output: initialOutput,
    onRun,
    focus: initialFocus,
    highlights: initialHighlights,
    allowBuilder = false,
    hideLogo,
}: CannonProviderProps) => {
    const [runner, setRunner] = useState<RunnerInformation | undefined>(undefined);
    const [cannonStatus, setCannonStatus] = useState<CannonStatus>(CannonStatus.Unintialized);
    const [output, setOutput] = useState<string>(initialOutput || "");
    const [events, setEvents] = useState<CannonEvent[] | undefined>(undefined);
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
    const [isBuilderActive, setIsBuilderActive] = useState(allowBuilder);

    // Validate focus
    if (initialFocus) {
        if (!files[initialFocus.filePath]) {
            console.error(`Focus file ${initialFocus.filePath} does not exist`);
        }
    }
    const [focus, setFocus] = useState<Focus>(initialFocus || { filePath: Object.keys(files)[0] });
    const [highlights, setHighlights] = useState<Highlight[] | undefined>(initialHighlights);


    useEffect(() => {
        if (!events?.length) return;
        for (const event of events) {
            for (const listener of listeners[event.name]) {
                listener(event);
            }
        }
    }, [events]);

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
                            setEvents([{
                                name: CannonEventName.output,
                                data: text,
                            }]);
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
                            setEvents([{
                                name: CannonEventName.output,
                                data: text,
                            }]);
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
                            setEvents([{
                                name: CannonEventName.output,
                                data: text,
                            }]);
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

                    setRunner({
                        language,
                        // @ts-ignore
                        client: await window.loadPyodide({
                            fullStdLib: true,
                            stdout: (text: string) => {
                                setOutput(prevOutput => `${prevOutput}${text}`);
                                setEvents([{
                                    name: CannonEventName.output,
                                    data: text,
                                }]);
                            },
                            stderr: (text: string) => {
                                setOutput(prevOutput => `${prevOutput}${text}`);
                                setEvents([{
                                    name: CannonEventName.output,
                                    data: text,
                                }]);
                            }
                        }),
                    });

                    setCannonStatus(CannonStatus.Ready)
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

    useEffect(() => {
        // Set event for initial output.
        if (initialOutput) {
            setEvents([{
                name: CannonEventName.output,
                data: initialOutput,
            }]);
        }
    }, []);
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
            builderMode: {
                isEnabled: allowBuilder,
                isActive: isBuilderActive,
                setIsActive: setIsBuilderActive,
            },
            hideLogo,
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
            setEvents([{
                name: CannonEventName.output,
                data: "",
                clear: true,
            }]);
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

                        const requestFiles = Object.entries(files).reduce((a, [fileName, file]) => {
                            a[fileName] = file.content;
                            return a;
                        }, {} as Record<string, string>);

                        // TODO: statically match this type to the runner input type using openapi.
                        const requestBody: any = {
                            files: requestFiles,
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
                            setEvents([{
                                name: CannonEventName.output,
                                data: text,
                            }]);
                        }
                    } catch (e: any) {
                        // TODO: set output on event, no need to set it up individually.
                        setOutput(e.toString());
                        setEvents([{
                            name: CannonEventName.output,
                            data: e.toString(),
                        }]);
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
                        setEvents([{
                            name: CannonEventName.output,
                            data: formatted,
                        }]);

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

    const handleReset = (options?: ResetOptions) => {
        switch (options?.type) {
            case 'initial':
            case undefined: {

                setOutput("");
                setEvents([{
                    name: CannonEventName.output,
                    data: "",
                    clear: true,
                }]);
                setFocus(initialFocus || { filePath: Object.keys(initialFiles)[0] });
                setFiles(
                    Object.entries(initialFiles).reduce((a, b) => {
                        a[b[0]] = {
                            content: b[1],
                            dirty: true,
                        };
                        return a;
                    }, {} as CannonFiles));
                setCannonStatus(CannonStatus.Running);
                setLanguageProps(initialLanguageProps);
                setHighlights(initialHighlights);
                break
            }
            case 'language': {
                const { initialFiles } = getTemplate(options.languageProps.language);
                setOutput("");
                setCannonStatus(CannonStatus.Unintialized);
                setEvents([{
                    name: CannonEventName.output,
                    data: "",
                    clear: true,
                }]);
                setFocus({ filePath: Object.keys(initialFiles)[0] });
                setFiles(
                    Object.entries(initialFiles).reduce((a, b) => {
                        a[b[0]] = {
                            content: b[1],
                            dirty: true,
                        };
                        return a;
                    }, {} as CannonFiles));
                setLanguageProps(options.languageProps);
                setHighlights(undefined);
                break
            }

            case 'upload': {
                const files = options.data.files;
                setOutput(options.data.output);
                setCannonStatus(CannonStatus.Unintialized);
                setEvents([{
                    name: CannonEventName.output,
                    data: options.data.output,
                    clear: true,
                }]);
                setFocus(options.data.focus);
                setFiles(
                    Object.entries(files).reduce((a, b) => {
                        a[b[0]] = {
                            content: b[1],
                            dirty: true,
                        };
                        return a;
                    }, {} as CannonFiles));
                setLanguageProps(options.data.languageProps);
                setHighlights(undefined);
                break
            }
            default:
                // TODO: this obviates the utility of the typecheck, but have to deal with ts annoyance. probably move to eslint?
                // @ts-ignore
                let _exhaustiveCheck: never = options;
        }
    };

    return (
        <Cannon.Provider
            key={languageProps.language}
            value={{
                runner,
                output,
                cannonStatus,
                fileData: {
                    files,
                    highlights,
                    focus,
                },
                builderMode: {
                    isEnabled: allowBuilder,
                    isActive: isBuilderActive,
                    setIsActive: setIsBuilderActive,
                },
                hideLogo,
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
                    reset: handleReset,
                    deleteFile: (fileName: string) => {
                        setFiles(prevFiles => {
                            const newFiles = { ...prevFiles };
                            delete newFiles[fileName];

                            // If we're deleting the active file, switch to another file
                            if (fileName === focus.filePath) {
                                const remainingFiles = Object.keys(newFiles);
                                if (remainingFiles.length > 0) {
                                    setFocus({ filePath: remainingFiles[0] });
                                }
                            }

                            return newFiles;
                        });
                    },
                    serialize: () => {
                        if (!runner) throw new Error('No runner');
                        return {
                            // TODO: runnerInformation contains the client, not ideal.
                            languageProps: serializeLanguageProps(languageProps),
                            files: Object.entries(files).reduce((acc, [key, value]) => {
                                acc[key] = value.content;
                                return acc;
                            }, {} as Record<string, string>),
                            focus,
                            output,
                        };

                    }
                },
            }}>
            {children}
        </Cannon.Provider>
    )
};

function serializeLanguageProps(languageProps: LanguageProps): CannonSerializedProps['languageProps'] {
    switch (languageProps.language) {
        case Language.Rust:
        case Language.Go:
        case Language.MaelstromGo:
            return {
                language: languageProps.language,
                runnerUrl: languageProps.runnerUrl,
                command: languageProps.command,
                options: languageProps.options,
            }
        case Language.Pyoidide:
            return {
                language: languageProps.language,
            }
        case Language.Javascript:
            return {
                language: languageProps.language,
                options: languageProps.options,
            }
        case Language.JavascriptWebContainer:
            return {
                language: languageProps.language,
                runCommand: languageProps.runCommand,
            }
        default:
            assertUnreachable(languageProps);
    }
}


export const useCannon = (): CannonContextType => {
    const cannon = useContext(Cannon);
    if (!cannon) {
        throw new Error('useCannon must be used within a CannonProvider');
    }
    return cannon;
}

