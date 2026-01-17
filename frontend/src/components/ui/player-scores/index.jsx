import React from "react";
import "./styles.css";

export default function PlayerScores({ players }) {
  return (
    <div className="player-scores-container">
      {players.map((player) => (
        <div key={player.id} className="player-score">
          {/* Circle with initial */}
          <div className="player-initial">
            {player.name.charAt(0).toUpperCase()}
          </div>
          {/* Name and score */}
          <div className="player-info">
            <span className="player-name">{player.name}</span>
            <span className="player-score-value">{player.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
