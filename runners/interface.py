from enum import Enum
from pydantic import BaseModel
from abc import ABC, abstractmethod
from modal import Image

class RunnerType(Enum):
    RUST = "rust"
    GO = "go"
    MAELSTROM_GO = "maelstrom_go"

class Input(BaseModel):
    files: dict[str, str] = {}
    command: str = ""
    language: RunnerType = RunnerType.RUST

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
