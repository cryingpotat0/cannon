import { Decoration, DecorationSet, EditorView, Tooltip, showTooltip } from "@codemirror/view"
import { StateField, StateEffect, Text } from "@codemirror/state"
import { Highlight } from "./types"

export const setHighlights = StateEffect.define<Highlight[]>()

function addRange({
  ranges, highlight, doc
}:
  { ranges: DecorationSet, highlight: Highlight, doc: Text }
) {
  const highlightColor = Decoration.mark({
    attributes: { style: `background-color: ${highlight.color}` }
  })

  const from = doc.line(highlight.start.line).from + (highlight.start.ch || 0);
  let to;
  if (highlight.end.ch) {
    to = doc.line(highlight.end.line).from + highlight.end.ch;
  } else {
    to = doc.line(highlight.end.line).to;
  }

  return ranges.update({
    add: [highlightColor.range(from, to)]
  })
}

const highlightedRanges = StateField.define({
  create() {
    return Decoration.none
  },
  update(oldHighlights, tr) {
    let ranges: DecorationSet = Decoration.none
    console.log('updating highlights')
    if (tr.docChanged) {
      return ranges
    }
    for (let e of tr.effects) {
      if (e.is(setHighlights)) {
        console.log('adding highlights')
        for (const highlight of e.value) {
          ranges = addRange({
            ranges, highlight, doc: tr.state.doc
          })
        }
      }
    }
    if (ranges === Decoration.none) return oldHighlights
    return ranges
  },
  provide: field => EditorView.decorations.from(field)
})


const cursorTooltipField = StateField.define<readonly Tooltip[]>({
  create: () => [],

  update(oldTooltips, tr) {
    const doc = tr.state.doc;
    let tooltips: Tooltip[] = [];
    if (tr.docChanged) {
      return [];
    }
    for (let e of tr.effects) {
      if (e.is(setHighlights)) {
        tooltips = [];
        for (const highlight of e.value) {
          const annotation = highlight.annotation;
          if (!annotation) continue;
          const from = doc.line(highlight.start.line).from + (highlight.start.ch || 0);
          let to;
          if (highlight.end.ch) {
            to = doc.line(highlight.end.line).from + highlight.end.ch;
          } else {
            to = doc.line(highlight.end.line).to;
          }
          let styleString = '';
          if (annotation.style) {
            styleString = Object.entries(annotation.style).map(([key, value]) => `${key}:${value}`).join(';');
          }

          let classNameString = '';
          if (annotation.className) {
            classNameString = annotation.className;
          };

          tooltips.push({
            pos: from,
            end: to,
            arrow: true,
            above: true,
            create: () => {
              let dom = document.createElement("div")
              dom.textContent = annotation.content
              // @ts-ignore
              dom.style = styleString
              dom.className = classNameString
              return {
                dom,
              }
            }
          })
        }
      }
    }

    if (!tooltips.length) return oldTooltips;
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
