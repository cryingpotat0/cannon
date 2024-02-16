import { Decoration, DecorationSet, EditorView, Tooltip, showTooltip } from "@codemirror/view"
import { StateField, StateEffect, ChangeDesc, Text } from "@codemirror/state"
import { Highlight } from "./types"

export const addHighlight = StateEffect.define<Highlight>()

function addRange({
  ranges, highlight, doc
}:
  { ranges: DecorationSet, highlight: Highlight, doc: Text }
) {
  const highlightColor = Decoration.mark({
    attributes: { style: `background-color: ${highlight.color}` }
  })

  const from = doc.line(highlight.start).from;
  const to = doc.line(highlight.end).to;

  return ranges.update({
    add: [highlightColor.range(from, to)]
  })
}

const highlightedRanges = StateField.define({
  create() {
    return Decoration.none
  },
  update(_, tr) {
    let ranges: DecorationSet = Decoration.none
    for (let e of tr.effects) {
      if (e.is(addHighlight)) {
        ranges = addRange({
          ranges, highlight: e.value, doc: tr.state.doc
        })
      }
    }
    return ranges
  },
  provide: field => EditorView.decorations.from(field)
})


const cursorTooltipField = StateField.define<readonly Tooltip[]>({
  create: () => [],

  update(_, tr) {
    const doc = tr.state.doc;
    const tooltips = [];
    for (let e of tr.effects) {
      if (e.is(addHighlight)) {
        const annotation = e.value.annotation;
        if (!annotation) continue;
        const from = doc.line(e.value.start).to;
        const to = doc.line(e.value.end).to;
        let styleString = '';
        if (annotation.style) {
          styleString = Object.entries(annotation.style).map(([key, value]) => `${key}:${value}`).join(';');
        }
        tooltips.push({
          pos: from,
          end: to,
          create: () => {
            let dom = document.createElement("div")
            dom.className = "cm-tooltip-cursor"
            dom.textContent = annotation.content
            // @ts-ignore
            dom.style = styleString
            return {
              dom,
              offset: {
                x: 10,
                y: -20,
              }
            }
          }
        })
      }
    }
    return tooltips;
  },

  provide: f => showTooltip.computeN([f], state => state.field(f))
})


// TODO: organize highlights so that nested ones are applied after the parents (getting everyone some chance to show).
// TODO: better typing of the highlight style
// TODO: smart defaults for styling font, background, etc.
// TODO: it's unclear how to deal with highlights once editing starts :/ have to start tracking "dirty" to decide whether to show highlights on that page or not. when something is dirtied the highlights are all invalidated sadly.
export function highlightExtension() {
  return [
    highlightedRanges,
    cursorTooltipField
  ]
}
