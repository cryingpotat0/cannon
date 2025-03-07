import CodeMirror from './codemirror';
import { useEffect, useRef, useState } from 'react';

import { EditorView, ViewUpdate, } from '@codemirror/view';
import { Extension, EditorSelection } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import TabSwitcher from './TabSwitcher';
import { useCannon } from './context';
import { highlightExtension, setHighlights } from './highlights';
import { CannonEventName } from './types';
import { ThemeOptions } from './create_theme';

function CodeEditor({
    extensions,
    onUpdate,
    theme,
}: {
    extensions?: Extension[],
    onUpdate?: ({ currentTab, update }: { currentTab: string, update: ViewUpdate }) => void,
    theme: ThemeOptions,
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
            // Do a bounds check:
            if (activeLine < 0 || activeLine >= cmEditor.current.state.doc.lines) {
                console.error('Invalid line number for focus', focus);
                return;
            }
            const activeLinePos = cmEditor.current.state.doc.line(activeLine);
            cmEditor.current.dispatch(
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
        <div id="code-editor">
            <TabSwitcher
                tabs={Object.keys(files)}
                activeTab={activeFile}
                setActiveTab={(tab) => changeFocus({ filePath: tab })}
                theme={theme}
            />
            <div ref={editorEl} />
        </div>
    )
}


export default CodeEditor;
