export default function GuessDisplay({ guesses }) {
  if (!guesses || guesses.length === 0) {
    return (
      <div className="guess-display-container">
        <p style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem", margin: 0 }}>
          Start drawing to see AI guesses...
        </p>
      </div>
    );
  }

  return (
    <div className="guess-display-container">
      {guesses.map((guess, idx) => {
        const isTop = idx === 0;
        return (
          <div
            key={guess.label}
            className={`guess-item${isTop ? " top-guess ai-pulse" : ""}`}
          >
            <div className="guess-label-row">
              <span className="guess-name">{guess.label.trim()}</span>
              <span className="guess-pct">{guess.confidence}%</span>
            </div>
            <div className="guess-bar-track">
              <div
                className="guess-bar-fill"
                style={{ width: `${guess.confidence}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
