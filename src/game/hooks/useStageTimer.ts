import { useEffect, useRef, useState } from 'react';

interface UseStageTimerOptions {
  active: boolean;
  durationSeconds: number;
  onExpire: () => void;
  resetKey: string | number;
}

export function useStageTimer({
  active,
  durationSeconds,
  onExpire,
  resetKey,
}: UseStageTimerOptions) {
  const [endAtMs, setEndAtMs] = useState(0);
  const [nowMs, setNowMs] = useState(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const startAt = performance.now();
      setEndAtMs(startAt + durationSeconds * 1000);
      setNowMs(startAt);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [durationSeconds, resetKey]);

  useEffect(() => {
    if (!active || endAtMs === 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      const nextNowMs = performance.now();
      const nextRemainingMs = Math.max(0, endAtMs - nextNowMs);
      setNowMs(nextNowMs);

      if (nextRemainingMs === 0) {
        window.clearInterval(timerId);
        onExpireRef.current();
      }
    }, 100);

    return () => {
      window.clearInterval(timerId);
    };
  }, [active, endAtMs]);

  if (endAtMs === 0) {
    return durationSeconds;
  }

  return Math.max(0, Math.ceil((endAtMs - nowMs) / 1000));
}
