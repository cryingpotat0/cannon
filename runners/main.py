from typing import Tuple
from fastapi.responses import StreamingResponse
from fastapi import HTTPException, Request

from modal import Stub, web_endpoint
import modal
import os
from time import time

from interface import SANDBOX_DIR, Runner, RunnerType, Input, get_unique_str_from_input
from go import GoRunner
from maelstrom_go import MaelstromGoRunner
from utils import write_files
from rust import RustRunner
from collections import deque

MAX_REQUESTS_PER_MINUTE = 5
stub = Stub("cannon_runners")
stub.rate_limiter = modal.Dict.from_name("cannon_rate_limiter", create_if_missing=True)
# This is unbounded in size for now, but 🤷.
stub.request_cache = modal.Dict.from_name("cannon_request_cache", create_if_missing=True)
stub.build_registry = modal.Dict.from_name("cannon_build_registry", create_if_missing=True)

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
    if current_deque.maxlen != MAX_REQUESTS_PER_MINUTE:
        current_deque = deque(current_deque, maxlen=MAX_REQUESTS_PER_MINUTE)
    allowed, new_deque = rate_limiter_internal(current_deque)
    shared_dict[ip_address] = new_deque
    return allowed

def rate_limiter_internal(current_deque) -> Tuple[bool, deque]:
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

def get_response_from_cache(item: Input, request: Request) -> Tuple[str, StreamingResponse | None]:

    item_unique_str = get_unique_str_from_input(
            item.files, item.command, item.language
            )

    # Check if Cache-Ignore is set
    if request.headers.get("Cache-Control") == "no-cache":
        print("Cache-Ignore set, not using cache")
        return item_unique_str, None
    try:
        (stderr, stdout) = stub.request_cache[item_unique_str] # type: ignore
        print(f"Found cached result for {item_unique_str}")
        return item_unique_str, StreamingResponse(fake_stream(stderr, stdout))
    except KeyError:
        pass
    return item_unique_str, None

# TODO: make this stream for real when sandboxes support streaming.
def fake_stream(stderr, stdout):
    for line in stderr:
        yield line
    for line in stdout:
        yield line

@stub.function(keep_warm=1, allow_concurrent_inputs=5)
@web_endpoint(method="POST")
def run(item: Input, request: Request):
    print(f"Received {item}") 
    runner = get_language_runner(item.language)

    if not item.files:
        item.files = runner.get_default_files()
    if not item.command:
        item.command = " && ".join(runner.get_default_command())

    (item_unique_str, cached_response) = get_response_from_cache(item, request)
    if cached_response:
        return cached_response

    if not rate_limiter(request):
        print("Too many requests")
        raise HTTPException(status_code=429, detail="Too many requests")

    # TODO: evaluate the security risk here, i couldn't get the NFS to work yet.
    # Create a temp directory and write files.
    root = "./app"
    write_files(root, item.files)

    image_unique_str, image = runner.get_custom_image(stub.build_registry, item.image_build_args)
    print(f"Running {item.command} in {image.object_id}")

    sb = stub.spawn_sandbox(
            "sh",
            "-c",
            item.command,
            timeout=100,
            workdir=SANDBOX_DIR,
            mounts=[modal.Mount.from_local_dir(root, remote_path=SANDBOX_DIR)],
            image=image,
            cpu=1,
        )
    
    sb.wait()
    print(f"Finished running {item.command} in {image.object_id} with exit code {sb.returncode}")

    # TODO: today we have to set the image_id for custom images after the
    # stub is run so the image actually has an ID. This is a weird
    # abstraction currently, figure out how to make it better.
    if image_unique_str:
        print(f"Setting image ID {image.object_id} for {image_unique_str}")
        stub.build_registry[image_unique_str] = image.object_id # type: ignore

    stderr = [f"stderr: {l}\n" for l in sb.stderr.read().split('\n') if l]
    stdout = [f"stdout: {l}\n" for l in sb.stdout.read().split('\n') if l]

    stub.request_cache[item_unique_str] = (stderr, stdout) # type: ignore
    return StreamingResponse(fake_stream(stderr, stdout))

