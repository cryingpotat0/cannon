import CodeEditor from './CodeEditor';
import Terminal from './Terminal';

import { useState, MouseEvent, useEffect, useRef } from 'react';
import './cannon.css';
import { createTheme, ThemeOptions } from './create_theme';

export type RustPlaygroundProps = {
  initialFiles: Record<string, string>,
  editorTheme?: ThemeOptions,
  viewerTheme?: ThemeOptions,
}

export function Cannon({
  initialFiles,
  editorTheme,
  viewerTheme,
}: RustPlaygroundProps) {

  const runRustUrl = 'https://cryingpotat0--allpack-runners-rust-run.modal.run';
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>(initialFiles);
  const filesRef = useRef(files);

  const onRun = async (_event: MouseEvent) => {
    setIsLoading(true);
    setData([]);
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
    setIsLoading(false);
  }

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const setCode = (code: string) => {
    setFiles(prevFiles => ({
      ...prevFiles,
      'src/main.rs': code,
    }));
  }

  const initialCode = initialFiles?.['src/main.rs'] || '';

  const editorExtensions = editorTheme ? [createTheme(editorTheme)] : [];
  const viewerExtensions = viewerTheme ? [createTheme(viewerTheme)] : [];

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
