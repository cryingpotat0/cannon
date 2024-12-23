import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRefresh, faSpinner, faWrench } from '@fortawesome/free-solid-svg-icons';
import { MouseEventHandler, useState } from 'react';
import { useCannon } from './context';
import { ThemeOptions } from './create_theme';
import { CannonContextType, Language } from './types';

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
    const { builderMode, runner } = useCannon();

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
                    <LanguageSelect
                        theme={theme}
                        currentLanguage={runner.language}
                    />
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

