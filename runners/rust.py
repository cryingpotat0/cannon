from io import BytesIO
from typing import Iterator
from pydantic import BaseModel
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi import HTTPException, FastAPI

from modal import Image, Stub, web_endpoint, NetworkFileSystem
import modal
import subprocess
import os
import threading
import queue

image = Image.from_registry(
                "rust:1.73.0-buster",
                add_python="3.11",
            )

stub = Stub("allpack_runners_rust", image=image)

class RustInput(BaseModel):
    files: dict[str, str] = {
        "Cargo.toml": """
[package]
name = "hello-world"
version = "0.1.0"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[dependencies]
hashbrown = "0.14"
""",
        "src/main.rs": """
fn main() {
    println!("Hello, world!");
    println!("Hello, world2 !");
    let mut map = hashbrown::HashMap::new();
    map.insert(1, 2);
    println!("Hello, world3 !");
    println!("Hello, world4 {:?}!", map);
}
""",
        }

def stream_subprocess(cmd: str, cwd: str, output_queue: queue.Queue):
    """Run a subprocess and put its stdout and stderr into a queue."""
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=cwd, text=True, bufsize=1)

    def enqueue_stream(stream, stream_label):
        for line in stream:
            output_queue.put(f"{stream_label}: {line}")
        stream.close()

    threading.Thread(target=enqueue_stream, args=(process.stdout, 'stdout')).start()
    threading.Thread(target=enqueue_stream, args=(process.stderr, 'stderr')).start()

    process.wait()
    output_queue.put(None)  # Sentinel value to indicate the end of output

def generate_output(output_queue: queue.Queue):
    """Yield output lines from a queue."""
    while True:
        line = output_queue.get()
        if line is None:
            return  # Sentinel value received, end of output
        print(line)
        yield line


@stub.function()
@web_endpoint(method="POST")
def run(item: RustInput):
    print(f"Received {item}")
    # Create a temp directory
    root = "./rust_app"

    # Create files in the temp directory
    for name, content in item.files.items():
        directory = f"{root}/{os.path.dirname(name)}"
        file_name = os.path.basename(name)
        os.makedirs(directory, exist_ok=True)
        ls = subprocess.check_output(["ls", "-l", root])
        with open(f"{directory}/{file_name}", "w") as f:
            f.write(content)

    sb = stub.spawn_sandbox(
            "cargo",
            "run",
            timeout=60,
            workdir="/sandbox",
            mounts=[modal.Mount.from_local_dir(root, remote_path="/sandbox")],
            image=image,
        )
    sb.wait()
    print(sb.returncode)
    stderr = [f"stderr: {l}\n" for l in sb.stderr.read().split('\n') if l]
    stdout = [f"stdout: {l}\n" for l in sb.stdout.read().split('\n') if l]
    def fake_stream(stderr, stdout):
        for line in stderr:
            yield line
        for line in stdout:
            yield line
    return StreamingResponse(fake_stream(stderr, stdout))
            

    try:
        # Run cargo run in a streaming fashion
        cmd = "cargo run"
        output_queue = queue.Queue()

        # Start the subprocess with its output being handled by threads
        cmd = ["cargo", "run"]
        threading.Thread(target=stream_subprocess, args=(cmd, root, output_queue)).start()
        return StreamingResponse(generate_output(output_queue))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def main():
    app = fastapi()
