import CodeMirror from './codemirror';
import { useEffect, useRef, useState } from 'react';

import { EditorView, ViewUpdate, } from '@codemirror/view';
import { Extension, EditorSelection, } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import TabSwitcher from './TabSwitcher';
import { useCannon } from './context';
import { addHighlight, highlightExtension, resetHighlightsEffect } from './highlights';
import { CannonEventName } from './types';

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
      files,
      highlights,
      focus,
    },
    commands: {
      updateFile,
      changeFocus,
      on,
    },
  } = useCannon();


  useEffect(() => {
    if (!cmEditor.current) return;
    // TODO: make the reset callback reintroduce highlights and annotations
    const resetCallback = () => {
      cmEditor.current?.dispatch({
        changes: {
          from: 0,
          to: cmEditor.current!.state.doc.length,
          insert: files[activeFile].content,
        }
      });

      if (!highlights) return;

      const effects = highlights
        .filter((highlight) => highlight.filePath === activeFile)
        .map((highlight) => addHighlight.of(highlight));
      cmEditor.current?.dispatch({ effects });

    }
    const resetListener = on(CannonEventName.reset, resetCallback);
    return () => {
      resetListener.dispose();
    }
  }, [cmEditor]);


  const { filePath: activeFile, startLine: activeLine } = focus;
  const [currentText, setCurrentText] = useState<string>(files[activeFile].content);

  // React is hilarious. To make this work I have to do:
  // When a tab is clicked, update "activeFile"
  // When "activeFile" changes, update the editor
  // When the editor updates, update "currentText"
  // When "currentText" changes, update the file
  // I guess this is what happens when you mix a ref with a state variable.
  useEffect(() => {
    if (!activeLine || !cmEditor.current) return;

    // Try scrolling 5 lines below so that the line is in the middle of the screen.
    // TODO: there has to be a better way gdi
    let line = cmEditor.current.state.doc.line(activeLine + 5);
    if (!line) {
      line = cmEditor.current.state.doc.line(activeLine);
    }
    cmEditor.current.dispatch({
      scrollIntoView: true,
      selection: EditorSelection.cursor(line.from),
    });
  }, [activeLine]);


  useEffect(() => {
    if (!cmEditor.current) return;
    if (currentText === files[activeFile].content) return;
    console.log('updating file', activeFile);
    updateFile({
      fileName: activeFile,
      content: currentText,
    });
    // Reset highlights in codemirror.
    cmEditor.current.dispatch({ effects: [resetHighlightsEffect.of(null)] });
  }, [currentText]);

  useEffect(() => {
    if (!cmEditor.current) return;
    cmEditor.current.dispatch({
      changes: {
        from: 0,
        to: cmEditor.current!.state.doc.length,
        insert: files[activeFile].content,
      }
    });

    if (!highlights) return;

    const effects = highlights
      .filter((highlight) => highlight.filePath === activeFile)
      .map((highlight) => addHighlight.of(highlight));
    console.log('dispatching effects', highlights, effects, activeFile)
    cmEditor.current.dispatch({ effects });

  }, [highlights, activeFile]);


  useEffect(() => {
    if (!editorEl.current) return;
    if (cmEditor.current) return;
    const editor = CodeMirror({
      parentEl: editorEl.current,
      doc: files[activeFile].content,
      extentions: [
        basicSetup,
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            setCurrentText(update.view.state.doc.toString());
          }
        }),
        TabSwitcher({
          setActiveTab: (tab) => {
            changeFocus({
              filePath: tab,
            });
          },
          tabs: Object.keys(files),
          activeTab: activeFile,
        }),
        highlightExtension(),
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
