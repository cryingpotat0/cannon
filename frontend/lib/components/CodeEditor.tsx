import CodeMirror from './codemirror';
import { useEffect, useRef, useState } from 'react';

import { EditorView, ViewUpdate, } from '@codemirror/view';
import { Extension, EditorSelection } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import TabSwitcher, { setActiveTabEffect } from './TabSwitcher';
import { useCannon } from './context';
import { highlightExtension, setHighlights } from './highlights';
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
      cmEditor.current?.dispatch({
        effects: setHighlights.of(effects),
      });

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
    if (!cmEditor.current) return;
    if (currentText === files[activeFile].content) return;
    updateFile({
      fileName: activeFile,
      content: currentText,
    });
  }, [currentText]);

  useEffect(() => {
    if (!cmEditor.current) return;

    // Update the file if it's changed.
    if (cmEditor.current.state.doc.toString() !== files[activeFile].content) {
      cmEditor.current.dispatch({
        changes: {
          from: 0,
          to: cmEditor.current!.state.doc.length,
          insert: files[activeFile].content,
        }
      });
    }

    if (activeLine) {
      let line;
      const activeLinePos = cmEditor.current.state.doc.line(activeLine);
      line = cmEditor.current.state.doc.line(activeLine + 10);
      cmEditor.current.dispatch(
        {
          effects: [setActiveTabEffect.of(activeFile)],
        },
        {
          selection: EditorSelection.cursor(activeLinePos.from),
        },
        {
          effects: EditorView.scrollIntoView(activeLinePos.from, {
            y: 'start',
            yMargin: 0,
          }),
        }
      );
    } else {
      cmEditor.current.dispatch({
        effects: [setActiveTabEffect.of(activeFile)],
      });
    }

    const highlightEffects = (highlights || [])
      .filter((highlight) => highlight.filePath === activeFile)

    cmEditor.current.dispatch({
      effects: setHighlights.of(highlightEffects),
    });

  }, [highlights, focus]);

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
