import { useEffect, useRef, useState } from 'react';
import { Cannon, Language, getTemplate } from '../lib/main';

// function App() {
//   const { initialFiles, initialOutput } = getTemplate(Language.Rust);
//   return (
//     <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
//       <Cannon
//         languageProps={{
//           language: Language.Rust,
//         }}
//         initialFiles={initialFiles}
//         initialOutput={initialOutput}
//       />
//     </div>
//   )
// }

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
  const { initialFiles, initialOutput } = getTemplate(Language.Javascript);
  return (
    <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
      <Cannon
        languageProps={{
          language: Language.Javascript,
          iframe,
        }}
        initialFiles={initialFiles}
        initialOutput={initialOutput}
      />
    </div>
  )
}

export default App
