from enum import Enum
from pydantic import BaseModel
from functools import cached_property
from abc import ABC, abstractmethod
from modal import Image
import json
import hashlib

class RunnerType(Enum):
    RUST = "rust"
    GO = "go"
    MAELSTROM_GO = "maelstrom_go"

class Input(BaseModel):
    files: dict[str, str] = {}
    command: str = ""
    language: RunnerType = RunnerType.RUST

def get_unique_str_from_input(input: Input) -> str:
    file_to_sha1 = {}
    for filename, contents in sorted(input.files.items()):
        file_to_sha1[filename] = hashlib.sha1(bytes(contents, 'utf-8')).hexdigest()
    return json.dumps({
        "command": input.command,
        "files": file_to_sha1,
        "language": input.language.value
    }, sort_keys=True)


class Runner(ABC):
    @abstractmethod
    def get_lang(self) -> RunnerType:
        pass

    @abstractmethod
    def get_image(self) -> Image:
        pass

    @abstractmethod
    def get_default_files(self) -> dict[str, str]:
        pass

    @abstractmethod
    def get_default_command(self) -> str:
        pass
