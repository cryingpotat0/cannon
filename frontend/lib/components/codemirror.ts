
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';


import type { Extension } from "@codemirror/state";


export default ({
  parentEl,
  extentions,
  doc
}: {
  parentEl: HTMLElement,
  extentions?: Extension,
  doc?: string
}) => {
  return new EditorView({
    state: EditorState.create({
      doc: doc,
      extensions: extentions || [],
    }),
    parent: parentEl
  });
};
