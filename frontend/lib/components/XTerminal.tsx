import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import './XTerminal.css';
import { CannonEvent, CannonEventName, TerminalConfig } from './types';
import { useEffect, useRef, useState } from 'react';
import { useCannon } from './context';
import { TerminalBanner } from './TerminalBanner';

function Xterminal({
    config,
}: {
    config: TerminalConfig
}) {
    const xtermRef = useRef<HTMLDivElement>(null);
    const [terminal, setTerminal] = useState<Terminal>();
    const [fitAddon, setFitAddon] = useState<FitAddon>();
    const theme = {
        background: config.theme.settings.background,
        foreground: config.theme.settings.foreground,
        cursor: config.theme.settings.caret,
        selectionBackground: config.theme.settings.selection,
    };

    const {
        cannonStatus,
        commands: {
            run,
            on,
            reset,
        },
    } = useCannon();

    useEffect(() => {
        if (!xtermRef.current) {
            return;
        }

        const terminal = new Terminal({
            theme,
        });
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(xtermRef.current);
        const listener = on(CannonEventName.output, (event: CannonEvent) => {
            console.log('event', event);
            if (event.name !== CannonEventName.output) {
                return;
            }
            if (event.clear) {
                terminal.reset()
            }
            if (event.data) {
                event.data.split('\n').forEach((line) => {
                    terminal.writeln(line);
                });
            }
            // terminal.write(event.data);
        });

        setTerminal(terminal);
        setFitAddon(fitAddon);

        return () => {
            terminal.dispose();
            listener.dispose();
            console.log('disposing')
        }
    }, [xtermRef]);

    useEffect(() => {
        if (!terminal || !fitAddon) {
            return;
        }

        fitAddon.fit();
        terminal.focus();
    }, [terminal, fitAddon]);

    useEffect(() => {
        if (!terminal) {
            return;
        }

        const onData = (data: string) => {
            console.log('onData', data);
        };
        const onDataListener = terminal.onData(onData);

        return () => {
            onDataListener.dispose();
        };
    }, [terminal]);

    return (
        <div
            id="code-viewer"
            style={{
                backgroundColor: theme.background,
            }}>
            <TerminalBanner
                isLoading={cannonStatus === 'running'}
                onRun={run}
                reset={reset}
                theme={config.theme}
            />
            <div ref={xtermRef}
                style={{
                    paddingLeft: '1.25rem',
                }}
            />
        </div>
    );
}


export default Xterminal;

