from fastapi.responses import StreamingResponse
from fastapi import HTTPException, Request

from modal import Stub, web_endpoint
import modal
import os
from time import time

from interface import Runner, Language, Input
from go import GoRunner
from rust import RustRunner
from collections import deque

MAX_REQUESTS_PER_MINUTE = 2
stub = Stub("cannon_runners")
stub.rate_limiter = modal.Dict.new()

def get_language_runner(lang: Language) -> Runner:
    if lang == Language.RUST:
        return RustRunner()
    elif lang == Language.GO:
        return GoRunner()
    else:
        raise Exception(f"Unknown language {lang}")


# TODO: this doesn't work yet, the deque's are always showing up as empty.
def rate_limiter(request: Request):
    ip_address = request.client.host # type: ignore
    current_time = time()
    one_minute_ago = current_time - 60

    shared_dict: modal.Dict = stub.rate_limiter # type: ignore

    try:
        current_deque = shared_dict[ip_address] 
    except KeyError:
        shared_dict[ip_address] = deque(maxlen=MAX_REQUESTS_PER_MINUTE) # type: ignore

    print(f"Current deque: {shared_dict[ip_address]}")
        
    if len(shared_dict[ip_address]) < MAX_REQUESTS_PER_MINUTE:
        shared_dict[ip_address].appendleft(current_time)
        return True  # Request allowed

    # Deque is full, check the oldest request
    if shared_dict[ip_address][-1] < one_minute_ago:
        shared_dict[ip_address].pop()
        shared_dict[ip_address].appendleft(current_time)
        return True  # Request allowed

    return False

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

