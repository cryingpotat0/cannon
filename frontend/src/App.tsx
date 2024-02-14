import { useEffect, useRef, useState } from 'react';
import { Cannon, Language, getTemplate, solarizedLight } from '..';
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
      />

    </div>
  )
}

export default App
