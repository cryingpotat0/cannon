from typing import Tuple
from fastapi.responses import StreamingResponse
from fastapi import HTTPException, Request

from modal import Stub, web_endpoint
import modal
import os
from time import time

from interface import Runner, RunnerType, Input
from go import GoRunner
from maelstrom_go import MaelstromGoRunner
from rust import RustRunner
from collections import deque

MAX_REQUESTS_PER_MINUTE = 5
stub = Stub("cannon_runners")
stub.rate_limiter = modal.Dict.new()

def get_language_runner(lang: RunnerType) -> Runner:
    if lang == RunnerType.RUST:
        return RustRunner()
    elif lang == RunnerType.GO:
        return GoRunner()
    elif lang == RunnerType.MAELSTROM_GO:
        return MaelstromGoRunner()
    else:
        raise Exception(f"Unknown language {lang}")


# TODO: This isn't quite atomic yet, but it's good enough to start with.
def rate_limiter(request: Request):
    ip_address = request.client.host # type: ignore
    shared_dict: modal.Dict = stub.rate_limiter # type: ignore

    try:
        shared_dict[ip_address] 
    except KeyError:
        print(f"Creating new deque for {ip_address}")
        shared_dict[ip_address] = deque(maxlen=MAX_REQUESTS_PER_MINUTE) # type: ignore

    current_deque = shared_dict[ip_address]
    allowed, new_deque = rate_limiter_internal(ip_address, current_deque)
    shared_dict[ip_address] = new_deque
    return allowed

def rate_limiter_internal(ip_address, current_deque) -> Tuple[bool, deque]:
    print(f"Current deque: {current_deque}")
    current_time = time()
    one_minute_ago = current_time - 60

    if len(current_deque) < MAX_REQUESTS_PER_MINUTE:
        current_deque.appendleft(current_time)
        return (True, current_deque) # Request allowed

    # Deque is full, check the oldest request
    if current_deque[-1] < one_minute_ago:
        current_deque.pop()
        current_deque.appendleft(current_time)
        return (True, current_deque)  # Request allowed

    return (False, current_deque)

@stub.function(keep_warm=1, allow_concurrent_inputs=5)
@web_endpoint(method="POST")
def run(item: Input, request: Request):
    if not rate_limiter(request):
        print("Too many requests")
        raise HTTPException(status_code=429, detail="Too many requests")

    print(f"Received {item}") 
    runner = get_language_runner(item.language)

    if not item.files:
        item.files = runner.get_default_files()
    if not item.command:
        item.command = runner.get_default_command()

    # TODO: evaluate the security risk here, i couldn't get the NFS to work yet.
    # Create a temp directory
    root = "./app"
    # Create files in the temp directory
    for name, content in item.files.items():
        directory = f"{root}/{os.path.dirname(name)}"
        file_name = os.path.basename(name)
        os.makedirs(directory, exist_ok=True)
        with open(f"{directory}/{file_name}", "w") as f:
            f.write(content)

    image = runner.get_image()
    print(f"Running {item.command} in {image}")

    sb = stub.spawn_sandbox(
            "sh",
            "-c",
            item.command,
            timeout=60,
            workdir="/sandbox",
            mounts=[modal.Mount.from_local_dir(root, remote_path="/sandbox")],
            image=image,
        )
    sb.wait()
    print(f"Finished running {item.command} in {image} with exit code {sb.returncode}")

    stderr = [f"stderr: {l}\n" for l in sb.stderr.read().split('\n') if l]
    stdout = [f"stdout: {l}\n" for l in sb.stdout.read().split('\n') if l]

    # TODO: make this stream for real when sandboxes support streaming.
    def fake_stream(stderr, stdout):
        for line in stderr:
            yield line
        for line in stdout:
            yield line

    return StreamingResponse(fake_stream(stderr, stdout))

