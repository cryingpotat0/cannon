from interface import Language, Runner
from modal import Image

class GoRunner(Runner):
    def get_lang(self) -> Language:
        return Language.GO

    def get_image(self) -> Image:
        return Image.from_registry(
                "golang:1.21.4-bullseye",
                add_python="3.11",
            )

    def get_default_files(self) -> dict[str, str]:
        return {
        "main.go": """
package main

import (
    "fmt"
)

func main() {
    fmt.Println("Hello, world!")
}
""",
        }

    def get_default_command(self) -> str:
        return "go run main.go"

