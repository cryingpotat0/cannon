import { useEffect, useRef, useState } from 'react';
import { Cannon, Language, getTemplate } from '../lib/main';
import "./App.css";

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
  // iframe
}: {
  iframe: HTMLIFrameElement
}) {
  // const { initialFiles, initialOutput } = getTemplate(Language.Rust);
  return (
    <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
      <Cannon
        initialFiles={{
          "src/main.rs": `use dynomite::{Item, Attributes};

#[derive(Item)]
struct Order {
  #[dynomite(partition_key)]
  pk: String,
  quantity: u16
}

fn main() {
    let item: Attributes = Order {
      pk: "pk".to_string(),
      quantity: 4
    }.into();
    println!("{:#?}", item);
}
`,
          "Cargo.toml": `[package]
name = "hello-world"
version = "0.1.0"
edition = "2021"

[dependencies]
dynomite = "0.10"
`,
        }}
        initialOutput=""
        languageProps={{
          language: Language.Rust,
          runnerUrl: 'https://cryingpotat0--cannon-runners-run.modal.run',
        }}
        terminalConfig={{
          hideStderr: true,
        }}
      />

    </div>
  )
}

export default App
