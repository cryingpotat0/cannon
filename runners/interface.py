from enum import Enum
from typing import OrderedDict
from pydantic import BaseModel
from abc import ABC, abstractmethod
from modal import Image
import json
import hashlib

class RunnerType(Enum):
    RUST = "rust"
    GO = "go"
    MAELSTROM_GO = "maelstrom_go"

class Input(BaseModel):
    files: OrderedDict[str, str] = OrderedDict()
    command: str = ""
    language: RunnerType = RunnerType.RUST

def get_unique_str_from_input(input: Input) -> str:
    file_to_sha1 = []
    for filename, contents in input.files.items():
        file_to_sha1.append([(filename, hashlib.sha1(bytes(contents, 'utf-8')).hexdigest())])
    return json.dumps({
        "command": input.command,
        "files": file_to_sha1,
        "language": input.language.value
    }, sort_keys=True)

SANDBOX_DIR = "/sandbox"


class Runner(ABC):
    @abstractmethod
    def get_lang(self) -> RunnerType:
        pass

    @abstractmethod
    def get_image(self) -> Image:
        pass

    @abstractmethod
    def get_default_files(self) -> OrderedDict[str, str]:
        pass

    @abstractmethod
    def get_default_command(self) -> list[str]:
        pass
