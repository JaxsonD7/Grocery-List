import { useEffect, useState } from 'react';

/** Tracks the browser's visual viewport height, which shrinks on mobile when
 * the on-screen keyboard opens — unlike 100vh/100dvh, which don't. Modals use
 * this to size themselves so footer buttons (Save, Cancel, ...) never end up
 * hidden behind an open keyboard. */
export function useVisualViewportHeight(): number {
  const [height, setHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight,
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return height;
}
