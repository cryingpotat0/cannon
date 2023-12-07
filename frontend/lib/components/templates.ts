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
    case Language.Go:
      return goTemplate()
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
          },
          null,
          2
        )
      ,
      "/src/App.js": `
function App() {
    console.log("Hello world!");
    return (
        <div>
            <h2
                className="gradient-text text-center font-extrabold tracking-tight text-7xl leading-tight"
            >
                Build Better Blogs.
            </h2>
            <p className="m-auto max-w-xl text-center font-extrabold text-3xl leading-tight" style={{ color: '#f80531' }}>
                Cannon is a new kind of code viewer <br /> 
                for the modern web. <br />
                View, edit and run your code <br />
                within the comfort of Chrome. <br />
            </p>
        </div>
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
    </React.StrictMode>
);`,
      "/public/index.html": `
<html lang="en" >
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content = "width=device-width, initial-scale=1" />
        <meta name="theme-color" content = "#000000" />
        <meta
                name="description"
                content = "Web site created using create-react-app"
                />
        <title>React App</title>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
    </body>
</html>`,
      "/src/index.css": `
      .text-primary: {
        color: #f80531;
      }

      .gradient-text {
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
        --tw-gradient-from: #f80531 var(--tw-gradient-from-position);
        --tw-gradient-to: rgb(248 5 49 / 0) var(--tw-gradient-to-position);
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        --tw-gradient-to: #36041d var(--tw-gradient-to-position);
      }


      `,
    },
  }
};

const goTemplate = (): Template => ({
  initialFiles: {
    'main.go': `package main

import (
  "fmt"
  "github.com/google/uuid"
)

func main() {
  id := uuid.New()
  fmt.Printf("Generated UUID: %s\\n", id.String())
}`,
    'go.mod': `module hello_world

go 1.18

require github.com/google/uuid v1.3.0`
  },
  initialOutput:
    `Hello, world!
`
});
