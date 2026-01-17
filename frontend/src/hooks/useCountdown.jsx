import { useEffect, useState } from "react";

export function useCountdown(phaseStartedAt, phaseDuration) {
  const [remaining, setRemaining] = useState(() => {
    if (!phaseStartedAt || !phaseDuration) return 0;
    return Math.max(
      0,
      Math.ceil((phaseDuration - (Date.now() - phaseStartedAt)) / 1000),
    );
  });

  useEffect(() => {
    if (!phaseStartedAt || !phaseDuration) return;

    const calculateRemaining = () => {
      const elapsed = Date.now() - phaseStartedAt;
      return Math.max(0, Math.ceil((phaseDuration - elapsed) / 1000));
    };

    const interval = setInterval(() => {
      setRemaining(calculateRemaining());
    }, 250);

    return () => clearInterval(interval);
  }, [phaseStartedAt, phaseDuration]);

  return remaining;
}
