import { rust } from '@codemirror/lang-rust';
import CodeMirror from './codemirror';
import { useEffect, useRef } from 'react';

import { EditorView, ViewUpdate } from '@codemirror/view';
import debounce from "lodash.debounce";
import { Extension } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

function CodeEditor({
  code,
  setCode,
  extensions,
}: {
  code: string,
  setCode: (code: string) => void,
  extensions?: Extension[],
}) {

  let editorEl = useRef<HTMLDivElement>(null);
  let cmEditor = useRef<EditorView>(null);

  useEffect(() => {
    if (!editorEl.current) return;
    if (cmEditor.current) return;
    const editor = CodeMirror({
      parentEl: editorEl.current,
      doc: code,
      extentions: [
        basicSetup,
        keymap.of([indentWithTab]),
        rust(),
        EditorView.updateListener.of(debounce((update: ViewUpdate) => {
          if (update.docChanged) {
            setCode(update.view.state.doc.toString());
          }
        }, 150)),
      ].concat(extensions || []),
    });
    // @ts-ignore
    cmEditor.current = editor;
  }, [editorEl]);
  return (
    <div id="code-editor" ref={editorEl}>
    </div>
  )
}
export default CodeEditor;
