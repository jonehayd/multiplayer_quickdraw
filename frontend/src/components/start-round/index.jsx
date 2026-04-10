import { useLobbyContext } from "../../contexts/LobbyContext";
import { useCountdown } from "../../hooks/useCountdown";
import "./styles.css";

export default function StartRound() {
  const { lobbyInfo } = useLobbyContext();
  const lobby = lobbyInfo?.lobby;

  const { word, roundIndex, totalRounds, phaseStartedAt, phaseDuration } = lobby || {};
  const secondsLeft = useCountdown(phaseStartedAt, phaseDuration);

  if (!lobby)
    return <p className="sr-error">Unable to load lobby info!</p>;

  return (
    <div className="sr-page">
      <div className="sr-glow sr-glow-tl" />
      <div className="sr-glow sr-glow-br" />

      {/* nav bar */}
      <header className="sr-nav">
        <span className="sr-nav-title gradient-title">Quick Draw Battle</span>
        <div className="sr-round-badge">
          <span className="material-symbols-outlined">layers</span>
          Round {roundIndex} / {totalRounds}
        </div>
      </header>

      <main className="sr-main">
        {/* Countdown */}
        <div className="sr-countdown-wrapper">
          <div className="sr-orbit-ring sr-orbit-1" />
          <div className="sr-orbit-ring sr-orbit-2" />
          <div className="sr-countdown-number">{secondsLeft}</div>
        </div>

        <p className="sr-starting-label">Starting in...</p>

        {/* Word card */}
        <div className="glass-panel sr-word-card">
          <div className="sr-word-eyebrow">
            <span className="material-symbols-outlined">brush</span>
            Your Word
          </div>
          <h1 className="sr-word">{word}</h1>
          <p className="sr-word-hint">Get ready — the canvas opens when the timer hits zero.</p>
        </div>
      </main>
    </div>
  );
}
