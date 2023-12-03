import CodeMirror from './codemirror';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import { EditorView, ViewUpdate } from '@codemirror/view';
import debounce from "lodash.debounce";
import { Extension } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import TabSwitcher from './TabSwitcher';

function CodeEditor({
  files,
  setFiles,
  extensions,
}: {
  files: Record<string, string>,
  setFiles: Dispatch<SetStateAction<Record<string, string>>>,
  extensions?: Extension[],
}) {

  let editorEl = useRef<HTMLDivElement>(null);
  let cmEditor = useRef<EditorView>(null);
  let [activeTab, setActiveTab] = useState(Object.keys(files)[0]);
  let activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);


  useEffect(() => {
    if (!editorEl.current) return;
    if (cmEditor.current) return;
    const editor = CodeMirror({
      parentEl: editorEl.current,
      doc: files[activeTab],
      extentions: [
        basicSetup,
        keymap.of([indentWithTab]),
        EditorView.updateListener.of(debounce((update: ViewUpdate) => {
          // console.log('update', update);
          if (update.docChanged) {
            // setCode(update.view.state.doc.toString());
            // console.log('activeTabRef.current', activeTabRef.current);
            // console.log('files', files);
            // console.log('update.view.state.doc.toString()', update.view.state.doc.toString());
            setFiles((files) => {
              return {
                ...files,
                [activeTabRef.current]: update.view.state.doc.toString(),
              };
            });
          }
        }, 150)),
        TabSwitcher({
          setActiveTab: (tab) => {
            // Since we debounce the update listener, we need to manually update the state.
            // setFiles((files) => {
            //   return {
            //     ...files,
            //     [activeTabRef.current]: cmEditor.current!.state.doc.toString(),
            //   };
            // });

            // Finally set teh active tab. Do this at the end to avoid races.
            setActiveTab(tab);

            // Update the text in the editor.
            cmEditor.current!.dispatch({
              changes: {
                from: 0,
                to: cmEditor.current!.state.doc.length,
                insert: files[tab as string],
              }
            });

          },
          tabs: Object.keys(files),
          activeTab,
        })
      ].concat(extensions || [])
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
