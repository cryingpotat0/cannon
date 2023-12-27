import { SandpackClient } from "@codesandbox/sandpack-client";
import { ThemeOptions } from "./create_theme";
import { ViewUpdate } from '@codemirror/view';
import { WebContainer } from "@webcontainer/api";

export enum Language {
  Rust = 'rust',
  Javascript = 'javascript',
  JavascriptWebContainer = 'javascript_web_container',
  Go = 'go',
  MaelstromGo = 'maelstrom_go',
}

export type CannonContextType = {
  runner?: RunnerInformation;
  cannonStatus: CannonStatus;
  output: string;
  fileData: FileData;
  commands: {
    updateFile: (args: { fileName: string, content: string }) => void;
    updateActiveFile: (args: { fileName: string }) => void;
    updateLanguageProps: (updateFn: (prevLanguageProps: LanguageProps) => LanguageProps) => void;
    run(): void;
  },
}

export type CannonProps = {
  editorTheme?: ThemeOptions,
  viewerTheme?: ThemeOptions,
  onEditorUpdate?: ({ currentTab, update }: { currentTab: string, update: ViewUpdate }) => void,
  terminalConfig?: TerminalConfig,
} & CannonProviderProps;

export type TerminalConfig = {
  hideStderr?: boolean,
  onTerminalUpdate?: ({ text }: { text: string }) => void,
}

export type FileData = {
  activeFile: string;
  files: Record<string, string>;
};

export type CannonProviderProps = {
  languageProps: LanguageProps,
  files: Record<string, string>,
  children?: React.ReactNode,
  output?: string,
  onRun?: () => void,
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
  iframe?: HTMLIFrameElement,
}


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
  client: WebContainer
};

export enum CannonStatus {
  Ready = 'ready',
  Unintialized = 'uninitialized',
  Running = 'running',
}

