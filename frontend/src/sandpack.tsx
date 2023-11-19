import { ClientOptions, SandboxSetup, SandpackLogLevel, loadSandpackClient } from "@codesandbox/sandpack-client";
import { useEffect } from "react";

async function main() {
  // Iframe selector or element itself
  const iframe = document.getElementById("iframe") as HTMLIFrameElement;
  if (!iframe) throw new Error("No iframe found");

  // Files, environment and dependencies
  const content: SandboxSetup = {
    entry: "/index.js",
    files: {
      // We infer dependencies and the entry point from package.json 
      "/package.json": {
        code: JSON.stringify({
          main: "/index.js",
          type: "module",
          dependencies: { uuid: "latest" },
          scripts: {
            start: "node index.js",
          },
        })
      },

      // Main file
      "/index.js": {
        code: `
      console.log('hello');
            import http from 'http'
 
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  })
 res.end('Hello from Nodebox')
})
 
server.listen(3000, () => {
  console.log('Server is ready!')
})

      ` }
    },
    template: "node",
  };

  // Optional options
  const options: ClientOptions = {
    logLevel: SandpackLogLevel.Debug
  };

  // Properly load and mount the bundler
  const client = await loadSandpackClient(
    iframe,
    content,
    options
  );
  console.log('status', client.status);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('status', client.status);
  client.listen((msg) => {
    console.log('update', client.status, msg);
  });


  /**
   * When you make a change, you can just run `updateSandbox`. 
   * We'll automatically discover which files have changed
   * and hot reload them.
   */
  // client.updateSandbox({
  //   files: {
  //     "/index.js": {
  //       code: `console.log(require('uuid'))`,
  //     },
  //   },
  //   entry: "/index.js",
  //   dependencies: {
  //     uuid: "latest",
  //   },
  // });
}

function Test() {
  useEffect(() => {
    main();
  }, []);

  return (
    <div>
      <iframe id="iframe" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export default Test;
