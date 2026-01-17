import { useLobbyContext } from "../../contexts/LobbyContext";
import { useCountdown } from "../../hooks/useCountdown";
import "./styles.css";

export default function StartRound() {
  const { lobbyInfo } = useLobbyContext();
  const lobby = lobbyInfo?.lobby;

  const { word, roundIndex, totalRounds, phaseStartedAt, phaseDuration } =
    lobby;
  const secondsLeft = useCountdown(phaseStartedAt, phaseDuration);

  if (!lobby)
    return <p className="start-round-error">Unable to load lobby info!</p>;

  return (
    <div className="start-round">
      <div className="round-meta">
        <span className="round-label">Round</span>
        <span className="round-count">
          {roundIndex} / {totalRounds}
        </span>
      </div>

      <div className="countdown">
        <span className="countdown-number">{secondsLeft}</span>
        <span className="countdown-text">Starting in</span>
      </div>

      <div className="word-card">
        <span className="word-label">Your word</span>
        <h1 className="word">{word}</h1>
      </div>
    </div>
  );
}
