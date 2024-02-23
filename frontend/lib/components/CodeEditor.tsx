import CodeMirror from './codemirror';
import { useEffect, useRef, useState } from 'react';

import { EditorView, ViewUpdate, } from '@codemirror/view';
import { Extension, EditorSelection, Compartment, EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import TabSwitcher, { setActiveTabEffect } from './TabSwitcher';
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
  const cmEditable = new Compartment;
  const {
    controllable,
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
        .map((highlight) => addHighlight.of(highlight));
      cmEditor.current?.dispatch({ effects });

    }
    const resetListener = on(CannonEventName.reset, resetCallback);
    return () => {
      resetListener.dispose();
    }
  }, [cmEditor]);

  useEffect(() => {
    if (!cmEditor.current) return;
    console.log('setting controllable to', controllable);
    cmEditor.current.dispatch({
      effects:
        [cmEditable.reconfigure(EditorState.readOnly.of(!controllable))]
    });
  }, [controllable]);


  const { filePath: activeFile, startLine: activeLine } = focus;
  const [currentText, setCurrentText] = useState<string>(files[activeFile].content);

  // React is hilarious. To make this work I have to do:
  // When a tab is clicked, update "activeFile"
  // When "activeFile" changes, update the editor
  // When the editor updates, update "currentText"
  // When "currentText" changes, update the file
  // I guess this is what happens when you mix a ref with a state variable.

  // useEffect(() => {
  //   if (!activeLine || !cmEditor.current) return;
  //   // Make sure we're on the right file
  //   if (cmEditor.current.state.doc.toString() !== files[activeFile].content) {
  //     return;
  //   }

  //   // Try scrolling 5 lines below so that the line is in the middle of the screen.
  //   // TODO: there has to be a better way gdi
  //   let line = cmEditor.current.state.doc.line(activeLine + 5);
  //   if (!line) {
  //     line = cmEditor.current.state.doc.line(activeLine);
  //   }
  //   cmEditor.current.dispatch({
  //     scrollIntoView: true,
  //     selection: EditorSelection.cursor(line.from),
  //   });
  // }, [focus]);


  useEffect(() => {
    if (!cmEditor.current) return;
    if (currentText === files[activeFile].content) return;
    console.log('updating file', activeFile);
    updateFile({
      fileName: activeFile,
      content: currentText,
    });
    // Reset highlights in codemirror.
    // cmEditor.current.dispatch({ effects: [resetHighlightsEffect.of(null)] });
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


    // TODO: fix type
    const highlightEffects = (highlights || [])
      .filter((highlight) => highlight.filePath === activeFile)
      .map((highlight) => addHighlight.of(highlight));

    // If we have to scroll lines, we need to do things slightly differently.
    // Dispatch teh scroll and the highlights together after dispatching the
    // activeFile event.
    if (activeLine) {
      cmEditor.current.dispatch({
        effects: [setActiveTabEffect.of(activeFile)],
      });

      let line = cmEditor.current.state.doc.line(activeLine + 5);
      if (!line) {
        line = cmEditor.current.state.doc.line(activeLine);
      }
      // TODO: this is so janky. All this just to prevent highlights from
      // disappearing? Has to be a better way. Maybe change the higlight model.
      // Anyway, it kinda works.
      setTimeout(() => {
        cmEditor.current?.dispatch({
          effects: highlightEffects,
          scrollIntoView: true,
          selection: EditorSelection.cursor(line.from),
        });
      }, 10);
    } else {
      // If we don't have to scroll lines, we can just dispatch the highlights with the new file.
      cmEditor.current.dispatch({
        effects: [setActiveTabEffect.of(activeFile), ...highlightEffects],
      });
    }
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
        cmEditable.of(EditorState.readOnly.of(!controllable)),
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
