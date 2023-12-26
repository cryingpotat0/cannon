import { FileSystemTree } from "@webcontainer/api";

export function filesToWebcontainerFiles(files: Record<string, string>): FileSystemTree {
  const fileSystemTree: FileSystemTree = {};

  for (let filePath in files) {
    // Remove leading slashes from filePath.
    if (files.hasOwnProperty(filePath)) {
      const pathParts = filePath.split('/');
      let currentLevel = fileSystemTree;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (part === '') {
          continue;
        }

        // If it's the last part, it's a file
        if (i === pathParts.length - 1) {
          if (!currentLevel[part]) {
            currentLevel[part] = {
              file: {
                contents: '',
              }
            };
          }
          // @ts-ignore
          currentLevel[part].file.contents = files[filePath];
        } else {
          // It's a directory
          if (!currentLevel[part]) {
            currentLevel[part] = { directory: {} };
          }
          // @ts-ignore
          currentLevel = currentLevel[part].directory;
        }
      }
    }
  }


  return fileSystemTree;
}

