import { useState } from "react";
import GameEnd from "./index.jsx";
import { GiDiamondTrophy } from "react-icons/gi";

// Mock LobbyContext
import { LobbyContext } from "../../contexts/LobbyContext.jsx";

export default function TestGameEnd() {
  const [testCase, setTestCase] = useState("default");

  const testCases = {
    default: [
      { id: "u1", name: "Alice", score: 10 },
      { id: "u2", name: "Bob", score: 8 },
      { id: "u3", name: "Charlie", score: 5 },
      { id: "u4", name: "Diana", score: 3 },
      { id: "u5", name: "Eve", score: 1 },
    ],
    tieTop: [
      { id: "u1", name: "Alice", score: 10 },
      { id: "u2", name: "Bob", score: 10 },
      { id: "u3", name: "Charlie", score: 5 },
    ],
    lessThanFive: [
      { id: "u1", name: "Alice", score: 12 },
      { id: "u2", name: "Bob", score: 7 },
    ],
    singlePlayer: [{ id: "u1", name: "Alice", score: 5 }],
    noPlayers: [],
  };

  const lobbyInfo = {
    players: testCases[testCase],
  };

  const leaveLobby = () => alert("Back to lobby clicked!");

  return (
    <LobbyContext.Provider value={{ lobbyInfo, leaveLobby }}>
      <div style={{ padding: "2rem" }}>
        <h2>GameEnd Test Harness</h2>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Select test case:{" "}
            <select
              value={testCase}
              onChange={(e) => setTestCase(e.target.value)}
            >
              {Object.keys(testCases).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
        </div>

        <GameEnd />

        <div style={{ marginTop: "2rem" }}>
          <p>Check console logs and podium layout for correctness:</p>
          <ul>
            <li>Top 3 players should appear on podium</li>
            <li>Tie cases should preserve sorting order</li>
            <li>Less than 5 players should not crash</li>
            <li>No players should render empty state gracefully</li>
          </ul>
        </div>
      </div>
    </LobbyContext.Provider>
  );
}
