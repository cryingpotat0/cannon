import { SandpackClient } from "@codesandbox/sandpack-client";
import { ThemeOptions } from "./create_theme";
import { ViewUpdate } from '@codemirror/view';
import { WebContainer } from "@webcontainer/api";


// A util to allow for exhaustive switch matches.
export function assertUnreachable(_: never): never;
export function assertUnreachable(_: Language) {
    throw new Error('Unreachable');
}

export enum Language {
    Rust = 'rust',
    Javascript = 'javascript',
    JavascriptWebContainer = 'javascript_web_container',
    Go = 'go',
    MaelstromGo = 'maelstrom_go',
    Pyoidide = 'pyoidide',
}

export type CannonEventListener = {
    dispose: () => void;
};

export enum CannonEventName {
    output = 'output',
};

export type CannonEvent = {
    name: CannonEventName.output,
    data: string,
    clear?: boolean,
};

export type CannonEventListenerFn = (data: CannonEvent) => void;

type highlightFunctionSetter = (prevHighlights: Highlight[]) => Highlight[];

export type ResetOptions = {
    type: 'initial';  // Reset to initial state
} | {
    type: 'language';
    languageProps: LanguageProps;  // Reset to new language
} | {
    type: 'upload';
    data: CannonSerializedProps;  // Reset to new files
}

export type CannonContextType = {
    runner?: RunnerInformation;
    cannonStatus: CannonStatus;
    output: string;
    fileData: FileData;
    builderMode: {
        isEnabled: boolean;
        isActive: boolean;
        setIsActive: (active: boolean) => void;
    };
    commands: {
        updateFile: (args: { fileName: string, content: string }) => void;
        updateLanguageProps: (updateFn: (prevLanguageProps: LanguageProps) => LanguageProps) => void;
        run(): void;
        on(event: CannonEventName, listener: CannonEventListenerFn): CannonEventListener;
        changeFocus: (focus: Focus) => void;
        setHighlights: ((setter: highlightFunctionSetter) => void);
        reset(options?: ResetOptions): void;
        deleteFile: (fileName: string) => void;
    },
}

export type CannonProps = {
    editorTheme?: ThemeOptions,
    viewerTheme?: ThemeOptions,
    onEditorUpdate?: ({ currentTab, update }: { currentTab: string, update: ViewUpdate }) => void,
    // This type is weird for backwards compatibility. Once I find all uses I should move to passing themes as part of these config objects.
    terminalConfig?: Omit<TerminalConfig, 'theme'>,
    allowBuilder?: boolean,
} & CannonProviderProps;

export type TerminalConfig = {
    hideStderr?: boolean,
    onTerminalUpdate?: ({ text }: { text: string }) => void,
    theme: ThemeOptions,
}

export type FileData = {
    files: CannonFiles,
    highlights?: Array<Highlight>;
    focus: Focus;
};

export type Highlight = {
    filePath: string,
    start: {
        line: number,
        ch?: number,
    },
    end: {
        line: number,
        ch?: number,
    },
    color: string,
    annotation?: {
        content: string;
        style?: Record<string, string>
        className?: string;
    };
};

export type Focus = {
    filePath: string,
    startLine?: number,
};

export type CannonFile = {
    content: string,
    dirty?: boolean,
    editable?: boolean,
}

export type CannonFiles = Record<string, CannonFile>;

export type CannonProviderProps = {
    languageProps: LanguageProps,
    files: Record<string, string>,
    children?: React.ReactNode,
    output?: string,
    onRun?: () => void,
    highlights?: Array<Highlight>,
    focus?: Focus,
    allowBuilder?: boolean,
}


export type LanguageProps = {
    language: Language.Rust | Language.Go | Language.MaelstromGo,
    runnerUrl: string,
    command?: string,
    options?: {
        imageBuilder?: {
            files: Record<string, string>,
            command?: string,
        },
        disableCache?: boolean,
    },
} | {
    language: Language.Javascript,
    iframe?: HTMLIFrameElement,
    options?: {
        externalResources?: string[],
        bundlerURL?: string,
    },
} | {
    language: Language.JavascriptWebContainer,
    runCommand?: {
        command: string,
        args: string[],
        env?: Record<string, string>,
    },
    iframe?: HTMLIFrameElement,
} | {
    language: Language.Pyoidide,
};


// TODO: replace it with teh actual type.
type PyodideInterface = {
    runPythonAsync: (code: string) => Promise<string>,
    globals: any;
};

export type RunnerInformation = {
    language: Language.Rust | Language.Go | Language.MaelstromGo,
    runnerUrl: string,
    command?: string,
    options?: {
        imageBuilder?: {
            files: Record<string, string>,
            command?: string,
        },
        disableCache?: boolean,
    },
} | {
    language: Language.Javascript,
    client: SandpackClient,
} | {
    language: Language.JavascriptWebContainer,
    client: WebContainer,
} | {
    language: Language.Pyoidide,
    client: PyodideInterface,
};

export enum CannonStatus {
    Ready = 'ready',
    Unintialized = 'uninitialized',
    Running = 'running',
}

export type CannonSerializedProps = {
    languageProps: LanguageProps,
    files: Record<string, string>;
    focus: {
        filePath: string;
        startLine?: number;
    };
    output: string;
};

