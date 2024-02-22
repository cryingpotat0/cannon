import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRefresh, faSpinner, } from '@fortawesome/free-solid-svg-icons';
import { MouseEventHandler } from 'react';

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

