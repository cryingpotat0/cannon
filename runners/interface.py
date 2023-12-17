from enum import Enum
from typing import Optional, OrderedDict, Tuple
from pydantic import BaseModel
from abc import ABC, abstractmethod
from modal import Image
from utils import write_files
import json
import hashlib
import modal

class RunnerType(Enum):
    RUST = "rust"
    GO = "go"
    MAELSTROM_GO = "maelstrom_go"

class ImageBuildArgs(BaseModel):
    files: OrderedDict[str, str] = OrderedDict()
    command: str = ""

class Input(BaseModel):
    files: OrderedDict[str, str] = OrderedDict()
    command: str = ""
    language: RunnerType = RunnerType.RUST
    image_build_args: Optional[ImageBuildArgs] = None


def get_unique_str_from_input(
        files: OrderedDict[str, str],
        command: str,
        language: RunnerType
        ) -> str:
    file_to_sha1 = []
    for filename, contents in files.items():
        file_to_sha1.append([(filename, hashlib.sha1(bytes(contents, 'utf-8')).hexdigest())])
    return json.dumps({
        "command": command,
        "files": file_to_sha1,
        "language": language.value
    }, sort_keys=True)

SANDBOX_DIR = "/sandbox"


class Runner(ABC):
    @abstractmethod
    def get_lang(self) -> RunnerType:
        pass

    @abstractmethod
    def get_image(self) -> Image:
        pass

    def get_custom_image(self, build_registry: modal.Dict, image_build_args: Optional[ImageBuildArgs]) -> Tuple[Optional[str], Image]:
        if image_build_args is None:
            return (None, self.get_image())

        if not image_build_args.command:
            image_build_args.command = " && ".join(self.get_default_command())
        print(f"Custom image requested with args: {image_build_args}")

        image_str = get_unique_str_from_input(image_build_args.files, image_build_args.command, self.get_lang())
        # TODO: starting a sandbox with an Image.from_id seems broken,
        # file a report with modal.
        # try:
        #     print(f"Looking up image {image_str} in dictionary...")
        #     img_id = build_registry[image_str]
        #     image = Image.from_id(img_id)
        #     print(f"Found image {image} with ID {img_id} in registry...")
        #     return (img_id, image)
        # except KeyError:
        #     print(f"Image not found in dictionary, building...")
        #     pass
        # except Exception as e:
        #     print(f"Image not found in registry, error: {e}, building...")
        #     pass
        root = "/image-builder"
        write_files(root, image_build_args.files)

        # TODO: allow arbitrary commands on image building is definitely
        # bad, but let's just see what happens 🤷. So far the worst case
        # is still getting my $30 modal credits stolen.
        new_image = self \
                .get_image() \
                .copy_local_dir(root, SANDBOX_DIR) \
                .workdir(SANDBOX_DIR) \
                .run_commands(image_build_args.command)\
        # TODO: there's some kinda caching issue
        # with cargo rn where the client has to
        # set a build command that ends with
        # cargo clean -p with the packge name.
        # Figure out why this happens later.

        print(f"Built image {new_image}")
        return (image_str, new_image)

    @abstractmethod
    def get_default_files(self) -> OrderedDict[str, str]:
        pass

    @abstractmethod
    def get_default_command(self) -> list[str]:
        pass
