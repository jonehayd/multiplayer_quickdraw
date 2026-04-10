import React from "react";
import "./styles.css";

export default function PlayerScores({ players }) {
  return (
    <div className="player-scores-container">
      {players.map((player) => (
        <div key={player.id} className="player-score-item">
          <div className="player-score-left">
            <div className="player-initial">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="player-name">{player.name}</span>
          </div>
          <span className="player-score-value">{player.score}</span>
        </div>
      ))}
    </div>
  );
}
