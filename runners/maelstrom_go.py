from typing import OrderedDict
from interface import SANDBOX_DIR, RunnerType, Runner
from modal import Image, Stub
import os

from utils import write_files

class MaelstromGoRunner(Runner):
    def get_lang(self) -> RunnerType:
        return RunnerType.MAELSTROM_GO

    def get_image(self) -> Image:
        # Pre-write the files to the sandbox directory to have
        # a container with a warm build cache.
        # TODO: how do I get the same thing without writing to
        # disk for every request?
        root = "/image-builder"
        write_files(root, self.get_default_files())

        return Image.from_registry(
                "eclipse-temurin:17-jdk",
                add_python="3.11",
            ) \
            .apt_install("gnuplot") \
            .run_commands("wget https://github.com/jepsen-io/maelstrom/releases/download/v0.2.3/maelstrom.tar.bz2") \
            .apt_install("bzip2") \
            .run_commands("tar -xvf maelstrom.tar.bz2") \
            .apt_install("git") \
            .apt_install("golang") \
            .copy_local_dir(root, SANDBOX_DIR) \
            .workdir(SANDBOX_DIR) \
            .run_commands("go mod tidy && go install")
            

    def get_default_files(self) -> OrderedDict[str, str]:
        return OrderedDict({
        "main.go": """
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
""",
        "go.mod": """
module main
go 1.18

require github.com/jepsen-io/maelstrom/demo/go v0.0.0-20231205140322-b59de21565d8 // indirect
""",
        })

    def get_default_command(self) -> list[str]:
        return [
                "go mod tidy",
                "go install",
                "/maelstrom/maelstrom test -w echo --bin ~/go/bin/main --node-count 1 --time-limit 10"
            ]


# stub = Stub("cannon_runner_test-maelstrom_go",
#             image=MaelstromGoRunner().get_image())

# @stub.function()
# def main():
#     import subprocess, os
#     # First write all the files in the runner to the filesystem.
#     workdir = '/maelstrom-echo'
#     os.makedirs(workdir, exist_ok=True)
#     for filename, contents in MaelstromGoRunner().get_default_files().items():
#         with open(os.path.join(workdir, filename), "w") as f:
#             f.write(contents)

#     # Now run go install . in that directory
#     os.chdir(workdir)
#     command = 'go mod tidy && go install .'
#     is_error = False
#     try:
#         result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
#         output = result.stdout
#         error = result.stderr
#     except subprocess.CalledProcessError as e:
#         output = e.output
#         error = e.stderr
#         is_error = True


#     print(output)
#     print(error)
#     if is_error:
#         print("Error installing go binary")
#         return

#     # ls the go binary
#     # command = 'ls /root/go/bin/'
#     # print("Running command: " + command)
#     # try:
    #     result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
    #     output = result.stdout
    #     error = result.stderr
    #     print(output)
    # except subprocess.CalledProcessError as e:
    #     output = e.output
    #     error = e.stderr
    #     print("Error running command: " + command)
    #     print(output)
    #     print(error)
    # return

    # os.chdir('/maelstrom')
    # command = './maelstrom test -w echo --bin ~/go/bin/main --node-count 1 --time-limit 10'
    # try:
    #     result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
    #     output = result.stdout
    #     error = result.stderr
    # except subprocess.CalledProcessError as e:
    #     output = e.output
    #     error = e.stderr

    # print(output)
    # print(error)

