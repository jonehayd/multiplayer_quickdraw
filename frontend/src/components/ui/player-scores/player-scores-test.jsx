import React from "react";
import PlayerScores from ".";

export default function PlayerScoresTest() {
  const players = [
    { id: "1", name: "Alice", score: 3 },
    { id: "2", name: "Bob", score: 5 },
  ];

  return <PlayerScores players={players} />;
}
