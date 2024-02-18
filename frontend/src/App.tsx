import { useEffect, useRef, useState } from 'react';
import { Cannon, Language, getTemplate, solarizedLight } from '../lib/main';
import initialFiles from './astro_demo.json';
import "./App.css";

function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!iframeRef.current) return;
    setReady(true);
  }, [iframeRef]);
  return (
    <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
      {ready && iframeRef.current ? <CannonInner iframe={iframeRef.current} /> : null}
      <iframe ref={iframeRef} style={{
        border: '1px solid black',
        height: '500px',
        width: '100%',
        borderRadius: '5px',
      }}
      ></iframe>
    </div>
  )
}

function CannonInner({
  iframe
}: {
  iframe: HTMLIFrameElement
}) {
  // const { initialFiles, initialOutput: _ } = getTemplate(Language.MaelstromGo);
  // const { initialFiles, initialOutput: _ } = getTemplate(Language.JavascriptWebContainer);
  return (
    <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
      <Cannon
        files={initialFiles}
        output={""}
        languageProps={{
          language: Language.JavascriptWebContainer,
          iframe,
          // runnerUrl: 'https://cryingpotat0--cannon-runners-run.modal.run',
        }}
        terminalConfig={{
          hideStderr: true,
        }}
        focus={{
          filePath: "src/layouts/Page.astro",
        }}
        highlights={[
          {
            filePath: "src/layouts/Page.astro",
            start: {
              line: 36
            },
            end: {
              line: 46,
            },
            color: 'rgba(5, 230, 0, 0.3)',
            annotation: {
              content: 'This is a cool note',
              style: {
                'background-color': 'rgba(5, 230, 0, 1)',
                'border-radius': '5px',
                'border': '0px',
                color: 'black',
                padding: '0.5rem',
                'font-family': 'monospace',
              }
            },
          },
          {
            filePath: "src/layouts/Page.astro",
            start: { line: 40, ch: 34 },
            end: { line: 40, ch: 49 },
            color: 'rgba(255, 0, 0, 1)',
            annotation: {
              content: 'This is a cool note part 2',
              style: {
                'background-color': 'rgba(255, 230, 0, 1)',
                'border-radius': '5px',
                'border': '0px',
                color: 'black',
                padding: '0.5rem',
                'font-family': 'monospace',
              }
            },
          },
          {
            filePath: "src/pages/blog/index.astro",
            start: { line: 1 },
            end: { line: 10 },
            color: 'rgba(255, 230, 0, 0.3)',
            annotation: {
              content: 'This is a cool note part 3',
              style: {
                'background-color': 'rgba(255, 230, 0, 1)',
                'border-radius': '5px',
                'border': '0px',
                color: 'black',
                padding: '0.5rem',
                'font-family': 'monospace',
              }
            },
          }
        ]}
      />

    </div>
  )
}

export default App
