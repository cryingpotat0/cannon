import { Language } from "./Cannon"

export type Template = {
  initialFiles: Record<string, string>,
  initialOutput?: string
}

export const getTemplate = (language: Language): Template => {
  switch (language) {
    case Language.Rust:
      return rustTemplate()
    case Language.Javascript:
      return javascriptTemplate()
    default:
      throw new Error(`Unknown language: ${language}`)
  }
}

const rustTemplate = (): Template => ({
  initialFiles: {
    'src/main.rs': `fn main() {
  println!("Hello, world!");
}`,
    'Cargo.toml': `[package]
name = "hello_world"
version = "0.1.0"
edition = "2021"`
  },
  initialOutput:
    `stderr:   Compiling hello_world v0.1.0 (/playground)
stderr:   Finished dev [unoptimized + debuginfo] target(s) in 0.31s
stderr:   Running \`/playground/target/debug/hello_world\`
Hello, world!
`

});



const javascriptTemplate = () => {
  return {
    initialFiles: {
      // We infer dependencies and the entry point from package.json 
      "/package.json":
        JSON.stringify(
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
      ,
      "/src/App.js": `
function App() {
    console.log('hello');
return (
  <div className= "App" >
  <header className="App-header" >
    <p>
    Edit < code > src / App.js < /code> and save to reload.
    < /p>
    < a
className = "App-link"
href = "https://reactjs.org"
target = "_blank"
rel = "noopener noreferrer"
  >
  Learn React
    < /a>
    < /header>
    < /div>
  );
}

export default App;
`
      ,
      "/src/index.js": `
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  <App />
  < /React.StrictMode>
);

`,
      "/public/index.html": `
  < !DOCTYPE html >
    <html lang="en" >
      <head>
      <meta charset="utf-8" />
        <link rel="icon" href = "%PUBLIC_URL%/favicon.ico" />
          <meta name="viewport" content = "width=device-width, initial-scale=1" />
            <meta name="theme-color" content = "#000000" />
              <meta
      name="description"
content = "Web site created using create-react-app"
  />
  <link rel="apple-touch-icon" href = "%PUBLIC_URL%/logo192.png" />
    <!--
    manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
-->
  <link rel="manifest" href = "%PUBLIC_URL%/manifest.json" />
    <!--
    Notice the use of % PUBLIC_URL % in the tags above.
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
      "/src/index.css": `
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
  }
};
