import os
from typing import OrderedDict

def write_files(root: str, files: OrderedDict[str, str]):
    for name, content in files.items():
        directory = f"{root}/{os.path.dirname(name)}"
        file_name = os.path.basename(name)
        os.makedirs(directory, exist_ok=True)
        with open(f"{directory}/{file_name}", "w") as f:
            f.write(content)
