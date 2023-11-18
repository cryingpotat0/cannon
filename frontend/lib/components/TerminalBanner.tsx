import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { MouseEventHandler } from 'react';
import { EditorView, Panel, showPanel } from '@codemirror/view';
import { createRoot } from 'react-dom/client';
import { StateEffectType } from '@codemirror/state';

const TerminalBanner = ({
  onClick,
  isLoading,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>,
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
      <button
        onClick={onClick}
        disabled={isLoading}
        style={{
          backgroundColor: 'inherit',
          border: '0',
          borderRadius: '10%',
          cursor: 'pointer',
        }}>
        {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlay} />}
      </button>
    </div >
  );
};


function headerPanelGenerator(onRun: MouseEventHandler<HTMLButtonElement>, toggleLoading: StateEffectType<boolean>) {
  return function headerPanel(_view: EditorView): Panel {
    let dom = document.createElement("div")
    let root = createRoot(dom);
    root.render(<TerminalBanner isLoading={false} onClick={onRun} />);
    return {
      dom,
      top: true,
      update(update) {
        for (let t of update.transactions) {
          for (let e of t.effects) {
            if (e.is(toggleLoading)) {
              root.render(<TerminalBanner isLoading={Boolean(e.value)} onClick={onRun} />);
            }
          }
        }
      }
    }
  }
}


export default function header({
  onRun,
  toggleLoading,
}: {
  onRun: MouseEventHandler<HTMLButtonElement>
  toggleLoading: StateEffectType<boolean>
}) {
  return showPanel.of(headerPanelGenerator(onRun, toggleLoading))
}
