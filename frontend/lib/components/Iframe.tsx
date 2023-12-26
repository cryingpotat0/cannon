import { IframeHTMLAttributes, useEffect, useRef } from 'react';
import { useCannon } from './context';
import { Language } from './types';

function Iframe(props: IframeHTMLAttributes<HTMLIFrameElement>) {
  const iframeRef = useRef(null);
  const { commands: { updateLanguageProps } } = useCannon();

  useEffect(() => {
    if (iframeRef.current) {
      updateLanguageProps({
        languageProps: {
          language: Language.Javascript,
          iframe: iframeRef.current,
        },
      });
    }
  }, [iframeRef.current])

  return (
    <iframe
      ref={iframeRef}
      {...props}
    />
  );
}

export default Iframe;

