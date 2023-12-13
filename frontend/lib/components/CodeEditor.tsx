import CodeMirror from './codemirror';
import { useEffect, useRef } from 'react';

import { EditorView, ViewUpdate } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import TabSwitcher from './TabSwitcher';
import { useCannon } from './context';

function CodeEditor({
  extensions,
  onUpdate,
}: {
  extensions?: Extension[],
  onUpdate?: ({ currentTab, update }: { currentTab: string, update: ViewUpdate }) => void,
}) {

  let editorEl = useRef<HTMLDivElement>(null);
  let cmEditor = useRef<EditorView>(null);
  const {
    fileData: {
      activeFile,
      files,
    },
    commands: {
      updateFile,
      updateActiveFile,
    },
  } = useCannon();




  useEffect(() => {
    if (!cmEditor.current) return;
    cmEditor.current.dispatch({
      changes: {
        from: 0,
        to: cmEditor.current!.state.doc.length,
        insert: files[activeFile],
      }
    });
  }, [activeFile]);


  useEffect(() => {
    if (!editorEl.current) return;
    if (cmEditor.current) return;
    const editor = CodeMirror({
      parentEl: editorEl.current,
      doc: files[activeFile],
      extentions: [
        basicSetup,
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update: ViewUpdate) => {
          // console.log('update', update);
          if (update.docChanged) {
            // setCode(update.view.state.doc.toString());
            // console.log('activeTabRef.current', activeTabRef.current);
            const currentTab = activeFile.toString();
            const currentCode = update.view.state.doc.toString();
            // console.log('activeTabRef.current', currentTab, currentCode);
            // console.log('update.view.state.doc.toString()', update.view.state.doc.toString());
            updateFile({
              fileName: currentTab,
              content: currentCode
            })
          }
        }),
        TabSwitcher({
          setActiveTab: (tab) => {
            updateActiveFile({
              fileName: tab,
            });
          },
          tabs: Object.keys(files),
          activeTab: activeFile,
        })
      ]
        .concat(onUpdate ? [
          EditorView.updateListener.of((update: ViewUpdate) => {
            onUpdate({
              currentTab: activeFile,
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
