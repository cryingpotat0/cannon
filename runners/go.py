from typing import OrderedDict
from interface import RunnerType, Runner
from modal import Image

class GoRunner(Runner):
    def get_lang(self) -> RunnerType:
        return RunnerType.GO

    def get_image(self) -> Image:
        return Image.from_registry(
                "golang:1.21.4-bullseye",
                add_python="3.11",
            )

    def get_default_files(self) -> OrderedDict[str, str]:
        return OrderedDict({
        "main.go": """
package main

import (
  "fmt"
  "github.com/google/uuid"
)

func main() {
  id := uuid.New()
  fmt.Printf("Generated UUID: %s\\n", id.String())
}
""",
        "go.mod": """
module main
go 1.18

require github.com/google/uuid v1.3.0
""",
        })

    def get_default_command(self) -> list[str]:
        return ["go mod tidy", "go run main.go"]

