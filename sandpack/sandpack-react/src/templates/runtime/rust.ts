export const RUST_TEMPLATE = {
  files: {
    "Cargo.toml": {
      code: `
[package]
name = "hello_world"
version = "0.1.0"
`
    },
    "src/main.rs": {
      code: `
fn main() {
  println!("Hello, world!");
}
`
    }
  },
};
