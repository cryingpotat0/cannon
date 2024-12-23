import { useEffect, useRef } from 'react';
import { ThemeOptions } from './create_theme';

interface TabSwitcherProps {
    setActiveTab: (tab: string) => void;
    tabs: string[];
    activeTab: string;
    theme: ThemeOptions;
}

const TabSwitcher = ({ setActiveTab, tabs, activeTab, theme }: TabSwitcherProps) => {
    const activeTabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTabRef.current) {
            activeTabRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }, [activeTabRef.current]);

    return (
        <div style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '0.25rem 1.25rem 0.5rem 1.25rem',
            whiteSpace: 'nowrap',
            backgroundColor: theme.settings.background,
            color: theme.settings.foreground,
        }}>
            {tabs.map((tab, index) => (
                <div
                    key={index}
                    onClick={() => setActiveTab(tab)}
                    style={{
                        cursor: 'pointer',
                        padding: '0.3rem 0.3rem',
                        fontWeight: activeTab === tab ? 'bold' : 'normal',
                        marginRight: '0.5rem',
                        fontFamily: 'monospace',
                    }}
                    ref={activeTab === tab ? activeTabRef : null}
                >
                    {tab}
                </div>
            ))}
        </div>
    );
};

export default TabSwitcher;
