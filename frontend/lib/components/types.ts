import { SandpackClient } from "@codesandbox/sandpack-client";
import { ThemeOptions } from "./create_theme";
import { ViewUpdate } from '@codemirror/view';

export enum Language {
  Rust = 'rust',
  Javascript = 'javascript',
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
  iframe: HTMLIFrameElement,
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
};

export enum CannonStatus {
  Ready = 'ready',
  Unintialized = 'uninitialized',
  Running = 'running',
}

