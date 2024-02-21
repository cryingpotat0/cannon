import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRefresh, faSpinner, } from '@fortawesome/free-solid-svg-icons';
import { MouseEventHandler } from 'react';
import { EditorView, Panel, showPanel } from '@codemirror/view';
import { createRoot } from 'react-dom/client';
import { StateEffectType } from '@codemirror/state';

export const TerminalBanner = ({
  onRun,
  reset,
  isLoading,
}: {
  onRun?: MouseEventHandler<HTMLButtonElement>,
  reset: MouseEventHandler<HTMLButtonElement>,
  isLoading: boolean
}) => {
  return (
    <div style={{
      padding: "0.75rem 1.25rem 1rem 1.25rem",
      display: "flex",
      justifyContent: "space-between",
    }}>
      <span style={{
        fontWeight: "bold",
        fontFamily: "monospace",
      }}>{">_ Terminal"}</span>
      <div style={{
        display: "flex",
        gap: "0.5rem",
      }}>
        <button
          onClick={reset}
          disabled={isLoading}
          style={{
            backgroundColor: 'inherit',
            border: '0',
            borderRadius: '10%',
            cursor: 'pointer',
          }}>
          <FontAwesomeIcon icon={faRefresh} />
        </button>
        <button
          onClick={onRun}
          disabled={isLoading}
          style={{
            backgroundColor: 'inherit',
            border: '0',
            borderRadius: '10%',
            cursor: 'pointer',
          }}>
          {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlay} />}
        </button>
      </div>
    </div >
  );
};


function headerPanelGenerator(onRun: MouseEventHandler<HTMLButtonElement>, toggleLoading: StateEffectType<boolean>) {
  return function headerPanel(_view: EditorView): Panel {
    let dom = document.createElement("div")
    let root = createRoot(dom);
    root.render(<TerminalBanner isLoading={false} onRun={onRun} />);
    return {
      dom,
      top: true,
      update(update) {
        for (let t of update.transactions) {
          for (let e of t.effects) {
            if (e.is(toggleLoading)) {
              root.render(<TerminalBanner isLoading={Boolean(e.value)} onRun={onRun} />);
            }
          }
        }
      }
    }
  }
}


export function CmTerminalBanner({
  onRun,
  toggleLoading,
}: {
  onRun: MouseEventHandler<HTMLButtonElement>
  toggleLoading: StateEffectType<boolean>
}) {
  return showPanel.of(headerPanelGenerator(onRun, toggleLoading))
}
