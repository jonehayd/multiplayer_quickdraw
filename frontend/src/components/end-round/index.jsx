import { useLobbyContext } from "../../contexts/LobbyContext";
import { useCountdown } from "../../hooks/useCountdown";
import "./styles.css";

export default function RoundEnd() {
  const { lobbyInfo } = useLobbyContext();
  const lobby = lobbyInfo?.lobby;

  const { phaseStartedAt, phaseDuration, roundWinner, winningGuess } = lobby;

  const secondsLeft = useCountdown(phaseStartedAt, phaseDuration);

  if (!lobby)
    return <p className="round-end-error">Unable to load lobby info!</p>;

  return (
    <div className="round-end">
      <div className="countdown">
        <span className="countdown-number">{secondsLeft}</span>
        <span className="countdown-text">Next round starts in</span>
      </div>

      <div className="winner-card">
        <span className="winner-label">Round Winner</span>
        <h1 className="winner-name">{roundWinner ?? "No winner"}</h1>

        {winningGuess && (
          <div className="guess-info">
            <div className="guess-row">
              <span className="guess-label">Guess</span>
              <span className="guess-value">{lobby.word ?? "—"}</span>
            </div>

            <div className="guess-row">
              <span className="guess-label">Confidence</span>
              <span className="guess-value">{winningGuess.confidence}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
