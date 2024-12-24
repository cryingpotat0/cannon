import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRefresh, faSpinner, faWrench, faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { MouseEventHandler, useRef, useState } from 'react';
import { useCannon } from './context';
import { ThemeOptions } from './create_theme';
import { CannonContextType, Language, CannonSerializedProps } from './types';

const defaultRunnerUrl = 'https://cryingpotat0--cannon-runners-run.modal.run';

const LanguageSelect = ({ theme, currentLanguage }: {
    theme: ThemeOptions,
    currentLanguage: Language
}) => {
    const { commands } = useCannon();
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);

    const handleLanguageChange = (newLanguage: Language) => {
        if (newLanguage === currentLanguage) return;
        setPendingLanguage(newLanguage);
        setShowConfirm(true);
    };

    const confirmChange = (confirm: boolean) => {
        if (confirm && pendingLanguage) {
            commands.reset({
                type: 'language', languageProps: {
                    language: pendingLanguage,
                    // TODO: expose the runner url as an option
                    runnerUrl: defaultRunnerUrl,
                }
            });
        }
        setShowConfirm(false);
        setPendingLanguage(null);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                style={{
                    backgroundColor: 'inherit',
                    color: theme.settings.foreground,
                    border: `1px solid ${theme.settings.foreground}`,
                    borderRadius: '4px',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                }}
            >
                {Object.values(Language).map((lang) => (
                    <option key={lang} value={lang}>
                        {lang}
                    </option>
                ))}
            </select>

            {showConfirm && (
                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    alignItems: 'center',
                    fontSize: '0.8em',
                }}>
                    <span>Switch language?</span>
                    <button
                        onClick={() => confirmChange(true)}
                        style={{
                            backgroundColor: theme.settings.selection,
                            color: theme.settings.foreground,
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                        }}
                    >
                        Y
                    </button>
                    <button
                        onClick={() => confirmChange(false)}
                        style={{
                            backgroundColor: 'inherit',
                            color: theme.settings.foreground,
                            border: `1px solid ${theme.settings.foreground}`,
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                        }}
                    >
                        N
                    </button>
                </div>
            )}
        </div>
    );
};

const BuilderToggle = ({ theme }: { theme: ThemeOptions }) => {
    const { builderMode } = useCannon();
    if (!builderMode.isEnabled) return null;

    return (
        <button
            onClick={() => builderMode.setIsActive(!builderMode.isActive)}
            style={{
                backgroundColor: builderMode.isActive ? theme.settings.selection : 'inherit',
                border: '0',
                borderRadius: '10%',
                cursor: 'pointer',
                color: builderMode.isActive ? theme.settings.background : theme.settings.foreground,
                padding: '0.25rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'background-color 0.2s ease',
            }}
            title={builderMode.isActive ? "Switch to Preview Mode" : "Switch to Builder Mode"}
        >
            <FontAwesomeIcon icon={faWrench} />
        </button>
    );
};

const downloadProject = (project: CannonSerializedProps) => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cannon-project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const uploadProject = async (file: File, reset: CannonContextType['commands']['reset']) => {
    try {
        const text = await file.text();
        const project: CannonSerializedProps = JSON.parse(text);

        // Validate the uploaded project structure
        if (!project.languageProps?.language || !project.files) {
            throw new Error('Invalid project file');
        }

        reset({
            type: 'upload',
            data: project,
        });
    } catch (e) {
        console.error('Error loading project:', e);
        alert('Failed to load project file');
    }
};

export const TerminalBanner = ({
    onRun,
    reset,
    isLoading,
    theme,
}: {
    onRun?: MouseEventHandler<HTMLButtonElement>,
    reset: CannonContextType['commands']['reset'],
    isLoading: boolean,
    theme: ThemeOptions,
}) => {
    const { builderMode, runner, commands: { serialize } } = useCannon();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // TODO: this should just be a command on the runner.
    const handleDownload = () => {
        downloadProject(serialize())
    };

    const handleUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{
            padding: "0.75rem 1.25rem 1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            color: theme.settings.foreground,
        }}>
            <span style={{
                fontWeight: "bold",
                fontFamily: "monospace",
            }}>{">_ Terminal"}</span>
            <div style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
            }}>
                {builderMode.isActive && runner && (
                    <>
                        <LanguageSelect
                            theme={theme}
                            currentLanguage={runner.language}
                        />
                        <button
                            onClick={handleDownload}
                            style={{
                                backgroundColor: 'inherit',
                                border: '0',
                                borderRadius: '10%',
                                cursor: 'pointer',
                                color: theme.settings.foreground,
                            }}
                            title="Download Project"
                        >
                            <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button
                            onClick={handleUpload}
                            style={{
                                backgroundColor: 'inherit',
                                border: '0',
                                borderRadius: '10%',
                                cursor: 'pointer',
                                color: theme.settings.foreground,
                            }}
                            title="Upload Project"
                        >
                            <FontAwesomeIcon icon={faUpload} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".json"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    uploadProject(file, reset);
                                }
                                // Reset the input
                                e.target.value = '';
                            }}
                        />
                    </>
                )}
                <BuilderToggle theme={theme} />
                <button
                    onClick={() => reset({ type: 'initial' })}
                    disabled={isLoading}
                    style={{
                        backgroundColor: 'inherit',
                        border: '0',
                        borderRadius: '10%',
                        cursor: 'pointer',
                        color: theme.settings.foreground,
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
                        color: theme.settings.foreground,
                    }}>
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlay} />}
                </button>
            </div>
        </div>
    );
};

