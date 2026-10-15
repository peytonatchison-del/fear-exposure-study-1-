import { useEffect, useState } from 'react';

// Counts down from `seconds` to 0, once per second, restarting whenever
// `resetKey` changes. Used inside the exposure simulations to gate a
// "Continue"-style button for a fixed wait — building a beat of tension
// before the participant is allowed to move to the next, more
// anxiety-provoking step, instead of being able to click straight through.
export default function useCountdown(seconds, resetKey) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    setSecondsLeft(seconds);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // Deliberately excludes `seconds` from deps beyond the initial value of
    // this effect run — only resetKey should restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return secondsLeft;
}
