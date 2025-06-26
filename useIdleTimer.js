import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimer = (onIdle, timeout = 300000) => {
  const timeoutId = useRef();

  const resetTimer = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(onIdle, timeout);
  }, [onIdle, timeout]);

  const handleEvent = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    events.forEach(event => window.addEventListener(event, handleEvent));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleEvent));
      clearTimeout(timeoutId.current);
    };
  }, [handleEvent, resetTimer]);

  return null;
};