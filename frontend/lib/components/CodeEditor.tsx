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
  onUpdate,
}: {
  files: Record<string, string>,
  setFiles: Dispatch<SetStateAction<Record<string, string>>>,
  extensions?: Extension[],
  onUpdate?: ({ currentTab, update }: { currentTab: string, update: ViewUpdate }) => void,
}) {

  let editorEl = useRef<HTMLDivElement>(null);
  let cmEditor = useRef<EditorView>(null);
  let [activeTab, setActiveTab] = useState(Object.keys(files)[0]);
  let activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (!cmEditor.current) return;
    cmEditor.current.dispatch({
      changes: {
        from: 0,
        to: cmEditor.current!.state.doc.length,
        insert: files[activeTab],
      }
    });
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
        EditorView.updateListener.of((update: ViewUpdate) => {
          // console.log('update', update);
          if (update.docChanged) {
            // setCode(update.view.state.doc.toString());
            // console.log('activeTabRef.current', activeTabRef.current);
            const currentTab = activeTabRef.current.toString();
            const currentCode = update.view.state.doc.toString();
            // console.log('activeTabRef.current', currentTab, currentCode);
            // console.log('update.view.state.doc.toString()', update.view.state.doc.toString());
            setFiles((files) => {
              return {
                ...files,
                [currentTab]: currentCode,
              };
            });
          }
        }),
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


          },
          tabs: Object.keys(files),
          activeTab,
        })
      ]
        .concat(onUpdate ? [
          EditorView.updateListener.of((update: ViewUpdate) => {
            onUpdate({
              currentTab: activeTabRef.current,
              update,
            });
          }),
        ] : [])
        .concat(extensions || [])
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
