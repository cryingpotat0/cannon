import { Language, assertUnreachable } from "./types"

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
    case Language.JavascriptWebContainer:
      return javascriptWebcontainerTemplate()
    case Language.Go:
      return goTemplate()
    case Language.MaelstromGo:
      return maelstromGoTemplate()
    case Language.Pyoidide:
      return pythonTemplate()
    default:
      assertUnreachable(language)
  }
}

const pythonTemplate = (): Template => ({
  initialFiles: {
    'main.py': `print("Hello, world!")`
  },
  initialOutput:
    `Hello, world!`
});

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
      "/package.json": `
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
            },
            "browserslist": {
              "production": [
                ">0.2%",
                "not dead",
                "not op_mini all"
              ],
              "development": [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
              ]
            }
          }`
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
        <script 
          crossorigin="anonymous"
          src="https://cdn.tailwindcss.com"></script>
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

const javascriptWebcontainerTemplate = () => {
  return {
    initialFiles: {
      // We infer dependencies and the entry point from package.json 
      "/package.json":
        `
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
              "web-vitals": "^2.1.4",
              "tailwindcss": "^3.3.3"
            },
            "scripts": {
              "start": "react-scripts start",
              "build": "react-scripts build",
              "test": "react-scripts test",
              "eject": "react-scripts eject"
            },
            "browserslist": {
              "production": [
                ">0.2%",
                "not dead",
                "not op_mini all"
              ],
              "development": [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version"
              ]
            }
          }`
      ,
      "/tailwind.config.js": `
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
      `,
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
      @tailwind base;
      @tailwind components;
      @tailwind utilities;

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


const maelstromGoTemplate = (): Template => ({
  initialFiles: {
    'main.go': `
package main

import (
    "encoding/json"
    "log"

    maelstrom "github.com/jepsen-io/maelstrom/demo/go"
)

func main() {
    n := maelstrom.NewNode()
    n.Handle("echo", func(msg maelstrom.Message) error {
        // Unmarshal the message body as an loosely-typed map.
        var body map[string]any
        if err := json.Unmarshal(msg.Body, &body); err != nil {
            return err
        }

        // Update the message type to return back.
        body["type"] = "echo_ok"

        // Echo the original message back with the updated message type.
        return n.Reply(msg, body)
    })

    if err := n.Run(); err != nil {
        log.Fatal(err)
    }

}
`,
    'go.mod':
      `
module main
go 1.18

require github.com/jepsen-io/maelstrom/demo/go v0.0.0-20231205140322-b59de21565d8 // indirect
`
  },
  initialOutput:
    ``
});

