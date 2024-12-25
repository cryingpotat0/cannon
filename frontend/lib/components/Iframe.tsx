import { IframeHTMLAttributes, useEffect, useRef } from 'react';
import { useCannon } from './context';
import { Language } from './types';

function Iframe(props?: IframeHTMLAttributes<HTMLIFrameElement>) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { languageProps, commands: { updateLanguageProps } } = useCannon();

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            updateLanguageProps((curr) => {
                return {
                    ...curr,
                    iframe,
                }
            });
        }
    }, [iframeRef.current])

    if (![Language.Javascript, Language.JavascriptWebContainer].includes(languageProps.language)) {
        return null;
    }

    return (
        <iframe
            ref={iframeRef}
            {...props}
        />
    );
}

export default Iframe;

