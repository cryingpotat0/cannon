import { ClientOptions, SandboxSetup, loadSandpackClient } from "@codesandbox/sandpack-client";
import { useEffect, useState } from "react";

// Important file to look at:
//https://github.com/codesandbox/sandpack/blob/main/sandpack-react/src/contexts/utils/useClient.ts#L71


export async function mainReact() {
  // Iframe selector or element itself
  const iframe = document.getElementById("iframe") as HTMLIFrameElement;
  if (!iframe) throw new Error("No iframe found");

  const files = () => {
    return {
      // We infer dependencies and the entry point from package.json 
      "/package.json": {
        code: JSON.stringify(
          {
            "name": "test-cra",
            "version": "0.1.0",
            "private": true,
            "dependencies": {
              "@testing-library/jest-dom": "^5.17.0",
              "@testing-library/react": "^13.4.0",
              "@testing-library/user-event": "^13.5.0",
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "react-scripts": "5.0.1",
              "web-vitals": "^2.1.4"
            },
            "scripts": {
              "start": "react-scripts start",
              "build": "react-scripts build",
              "test": "react-scripts test",
              "eject": "react-scripts eject"
            }
          }
        )
      },
      "/src/App.js": {
        code: `
function App() {
  console.log('hello');
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
        `
      },
      "/src/index.js": {
        code: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

        `
      },
      "/public/index.html": {
        code: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the \`public\` folder during the build.
      Only files inside the \`public\` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running \`npm run build\`.
    -->
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run \`npm start\` or \`yarn start\`.
      To create a production bundle, use \`npm run build\` or \`yarn build\`.
    -->
  </body>
</html>
        `,
      },
      "/src/index.css": {
        code: `
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
        `,
      },
    };
  };

  // Files, environment and dependencies
  const content: SandboxSetup = {
    entry: "/index.js",
    files: files(),
    template: "create-react-app",
  };

  // Optional options
  const options: ClientOptions = {
    // logLevel: SandpackLogLevel.Debug
    showOpenInCodeSandbox: false,
    clearConsoleOnFirstCompile: true,
  };

  // Properly load and mount the bundler
  // // @ts-ignore
  // console.log('iframe', iframe.contentWindow!.console);
  // // @ts-ignore
  // iframe.contentWindow.console = {
  //   log: (...args: any[]) => {
  //     console.log('iframe', ...args);
  //   }
  // };
  const client = await loadSandpackClient(
    iframe,
    content,
    options
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  client.listen((msg) => {
    console.log('update', client.status, msg);
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));


  /**
   * When you make a change, you can just run `updateSandbox`. 
   * We'll automatically discover which files have changed
   * and hot reload them.
   */
  const files2 = files();
  files2['/src/App.js'].code = `

function App() {
  console.log('hello22');
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edited <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
  `;
  client.updateSandbox({
    files: files2,
  });
}

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
        console.log(console);
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
    // logLevel: SandpackLogLevel.Debug
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
    console.log(client.options.startRoute);
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
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    (async () => {
      await mainReact();
    })();
  }, []);

  return (
    <div>
      <iframe id="iframe" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export default Test;
