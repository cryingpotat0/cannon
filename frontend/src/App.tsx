import { Cannon } from '../lib/main';

function App() {
  return (
    <div style={{ maxWidth: "130ch", margin: "auto", marginTop: "30px" }}>
      <Cannon
        initialFiles={{
          'src/main.rs': `fn main() {
  println!("Hello, world!");
}`,
          'Cargo.toml': `[package]
name = "hello_world"
version = "0.1.0"
edition = "2021"`
        }}
        initialOutput={
          `stderr:   Compiling hello_world v0.1.0 (/playground)
stderr:   Finished dev [unoptimized + debuginfo] target(s) in 0.31s
stderr:   Running \`/playground/target/debug/hello_world\`
Hello, world!
`
        }
      />
    </div>
  )
}

export default App
