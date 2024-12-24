import { useEffect, useRef, useState } from 'react';
import { ThemeOptions } from './create_theme';
import { useCannon } from './context';

interface TabSwitcherProps {
    setActiveTab: (tab: string) => void;
    tabs: string[];
    activeTab: string;
    theme: ThemeOptions;
}

const TabSwitcher = ({ setActiveTab, tabs, activeTab, theme }: TabSwitcherProps) => {
    const activeTabRef = useRef<HTMLDivElement>(null);
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        builderMode: { isEnabled, isActive },
        commands: { updateFile, deleteFile }
    } = useCannon();

    const handleCreateFile = () => {
        if (newFileName && !tabs.includes(newFileName)) {
            updateFile({
                fileName: newFileName,
                content: '',
            });
            setActiveTab(newFileName);
        }
        setNewFileName('');
        setIsCreatingFile(false);
    };

    const handleCancel = () => {
        setNewFileName('');
        setIsCreatingFile(false);
    };

    const handleDeleteFile = (fileName: string) => {
        deleteFile(fileName);
        setDeletingFile(null);
    };

    useEffect(() => {
        if (isCreatingFile && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreatingFile]);

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
            alignItems: 'center',
        }}>
            {tabs.map((tab, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: '0.5rem',
                    }}
                >
                    <div
                        onClick={() => setActiveTab(tab)}
                        style={{
                            cursor: 'pointer',
                            padding: '0.3rem 0.3rem',
                            fontWeight: activeTab === tab ? 'bold' : 'normal',
                            fontFamily: 'monospace',
                        }}
                        ref={activeTab === tab ? activeTabRef : null}
                    >
                        {tab}
                    </div>
                    {isEnabled && isActive && (
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.3rem' }}>
                            {deletingFile === tab ? (
                                <div style={{
                                    display: 'flex',
                                    gap: '0.25rem',
                                    animation: 'slideIn 0.2s ease-out',
                                }}>
                                    <button
                                        onClick={() => handleDeleteFile(tab)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '0.2rem 0.4rem',
                                            backgroundColor: theme.settings.foreground,
                                            color: theme.settings.background,
                                            border: 'none',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => setDeletingFile(null)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '0.2rem 0.4rem',
                                            backgroundColor: theme.settings.foreground,
                                            color: theme.settings.background,
                                            border: 'none',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingFile(tab);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '0.2rem 0.4rem',
                                        opacity: 0.6,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                >
                                    🗑️
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {isEnabled && isActive && (
                <>
                    {isCreatingFile && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            animation: 'slideIn 0.2s ease-out',
                        }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFile();
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: `1px solid ${theme.settings.foreground}`,
                                    color: theme.settings.foreground,
                                    fontFamily: 'monospace',
                                    padding: '0.2rem',
                                    width: '120px',
                                    outline: 'none',
                                }}
                                placeholder="filename"
                            />
                            <div style={{
                                display: 'flex',
                                gap: '0.25rem',
                            }}>
                                <button
                                    onClick={handleCreateFile}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '0.2rem 0.4rem',
                                        backgroundColor: theme.settings.foreground,
                                        color: theme.settings.background,
                                        border: 'none',
                                        fontFamily: 'monospace',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={handleCancel}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '0.2rem 0.4rem',
                                        backgroundColor: theme.settings.foreground,
                                        color: theme.settings.background,
                                        border: 'none',
                                        fontFamily: 'monospace',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                    <div
                        onClick={() => !isCreatingFile && setIsCreatingFile(true)}
                        style={{
                            cursor: 'pointer',
                            padding: '0.2rem 0.4rem',
                            marginLeft: '0.5rem',
                            fontFamily: 'monospace',
                            userSelect: 'none',
                            backgroundColor: isCreatingFile ? 'transparent' : theme.settings.foreground,
                            color: isCreatingFile ? theme.settings.foreground : theme.settings.background,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        +
                    </div>
                </>
            )}
            <style>
                {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
            </style>
        </div>
    );
};

export default TabSwitcher;
