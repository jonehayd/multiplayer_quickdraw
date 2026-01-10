import { MdPeopleAlt } from "react-icons/md";
import { FaArrowLeft, FaCrown, FaCopy, FaCheck } from "react-icons/fa";
import { useState } from "react";
import "./styles.css";

const MAX_PLAYERS = 6;

export default function Lobby() {
  const [copied, setCopied] = useState(false);

  // Mock lobby state (replace later with server data)
  const inviteCode = "A7F9Q2";

  const players = [
    { id: 1, name: "Hayden", isHost: true },
    { id: 2, name: "Alex", isHost: false },
    { id: 3, name: "Sam", isHost: false },
    { id: 4, name: "Jess", isHost: false },
  ];

  const canStart = players.length >= 2;

  function handleCopyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function startGame() {
    if (!canStart) return;
    console.log("Starting game...");
  }

  return (
    <div className="lobby-page">
      {/* Exit lobby */}
      <button className="exit-lobby-btn">
        <FaArrowLeft />
        Exit Lobby
      </button>

      {/* Lobby container */}
      <div className="waiting-room-container">
        {/* Header */}
        <div className="waiting-room-header">
          <div className="people-icon">
            <MdPeopleAlt />
          </div>
          <h1>Waiting Room</h1>
          <p>Waiting for players to join…</p>
        </div>

        {/* Invite code */}
        <div className="invite-code-container">
          <span className="label">Invite Code</span>

          <div className="invite-code-box">
            <code>{inviteCode}</code>
            <button onClick={handleCopyInviteCode}>
              {copied ? <FaCheck /> : <FaCopy />}
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="players-section">
          <div className="players-header">
            <MdPeopleAlt />
            <p>
              Players ({players.length}/{MAX_PLAYERS})
            </p>
          </div>

          <ul className="players-list">
            {players.map((player) => (
              <li key={player.id} className="player-row">
                <div className="player-avatar">
                  {player.name[0].toUpperCase()}
                </div>

                <span className="player-name">
                  {player.name}
                  {player.isHost && (
                    <FaCrown className="host-icon" title="Host" />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start game */}
        <button
          className={`start-game-btn ${canStart ? "active" : ""}`}
          disabled={!canStart}
          onClick={startGame}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
