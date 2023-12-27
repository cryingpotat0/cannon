import { IframeHTMLAttributes, useEffect, useRef } from 'react';
import { useCannon } from './context';

function Iframe(props: IframeHTMLAttributes<HTMLIFrameElement>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { commands: { updateLanguageProps } } = useCannon();

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

  return (
    <iframe
      ref={iframeRef}
      {...props}
    />
  );
}

export default Iframe;

