import { useEffect, useRef } from 'react';

import { EditorState, Extension, RangeSetBuilder, StateEffect, StateEffectType, StateField } from "@codemirror/state";
import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import CodeMirror from './codemirror';
import { minimalSetup } from 'codemirror';
import TerminalBanner from './TerminalBanner';
import { CannonStatus, TerminalConfig } from './types';
import { useCannon } from './context';


class EmptyWidget extends WidgetType {
  toDOM() {
    // Create a <span>$ </span> DOM node.
    const span = document.createElement("span");
    span.textContent = "";
    return span;
  }
}

function stderrHighlight() {
  const decoration = Decoration.line({
    attributes: { style: "color: red;" }
  });

  const hideDecoration = Decoration.replace({
    widget: new EmptyWidget(),
    inclusive: true
  });

  return ViewPlugin.fromClass(class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    buildDecorations(view: EditorView) {
      let builder = new RangeSetBuilder<Decoration>();
      for (let { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
          let line = view.state.doc.lineAt(pos);
          if (line.text.startsWith("stderr: ")) {
            builder.add(line.from, line.from, decoration);
            builder.add(line.from, line.from + "stderr: ".length, hideDecoration);
          }
          if (line.text.startsWith("stdout: ")) {
            builder.add(line.from, line.from + "stdout: ".length, hideDecoration);
          }
          pos = line.to + 1;
        }
      }
      return builder.finish();
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }
  }, {
    decorations: v => v.decorations
  });
}


function Terminal({
  extensions,
  config,
}: {
  extensions: Extension[],
  config?: TerminalConfig,
}) {
  const {
    output,
    cannonStatus,
    commands: {
      run,
    },
  } = useCannon();

  let text = output;

  if (config?.hideStderr) {
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => !line.startsWith('stderr:'));
    text = filteredLines.join('\n');
  }
  config?.onTerminalUpdate?.({ text });


  let editorEl = useRef<HTMLDivElement>(null);
  let cmEditor = useRef<EditorView>(null);
  let toggleLoadingStateRef = useRef<StateField<boolean>>(null);
  let toggleLoadingRef = useRef<StateEffectType<boolean>>(null);

  useEffect(() => {
    if (!editorEl.current) return;
    if (cmEditor.current) return;

    const toggleLoading = StateEffect.define<boolean>();
    // @ts-ignore
    toggleLoadingRef.current = toggleLoading;

    // @ts-ignore
    toggleLoadingStateRef.current = StateField.define<boolean>({
      create: () => false,
      update(value, tr) {
        for (let e of tr.effects) if (toggleLoading && e.is(toggleLoading)) value = e.value
        return value
      },
    })

    const editor = CodeMirror({
      parentEl: editorEl.current,
      doc: text,
      extentions: [
        minimalSetup,
        stderrHighlight(),
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        TerminalBanner({
          onRun: run,
          toggleLoading
        }),
      ].concat(extensions),
    });

    // @ts-ignore
    cmEditor.current = editor;
  }, [editorEl]);

  useEffect(() => {
    if (!cmEditor.current) return;
    cmEditor.current.dispatch(
      {
        changes: {
          from: 0,
          to: cmEditor.current.state.doc.length,
          insert: text

        },
      }
    );
    cmEditor.current.scrollDOM.scrollTo({
      top: cmEditor.current.scrollDOM.scrollHeight,
      left: 0,
    });
  }, [text]);

  useEffect(() => {
    if (!cmEditor.current) return;
    cmEditor.current.dispatch(
      {
        effects: toggleLoadingRef.current!.of(cannonStatus === CannonStatus.Running),
      }
    );

  }, [cannonStatus]);


  return (
    <div id="code-viewer" ref={editorEl}>
    </div>
  )
}
export default Terminal;
