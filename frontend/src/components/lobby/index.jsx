import { MdPeopleAlt } from "react-icons/md";
import { FaArrowLeft, FaCrown, FaCopy, FaCheck } from "react-icons/fa";
import { useState } from "react";
import { useLobbyContext } from "../../contexts/LobbyContext";
import "./styles.css";

const MAX_PLAYERS = 4;

export default function Lobby() {
  const { lobbyInfo, leaveLobby, send } = useLobbyContext();
  const [copied, setCopied] = useState(false);

  if (!lobbyInfo) return null;

  const { userId, lobby } = lobbyInfo;
  const { inviteCode, players } = lobby;
  const canStart = players.length >= 2;

  const isHost = players.some((p) => p.id === userId && p.isHost);

  let statusText;
  let startButtonTitle;
  if (!canStart) {
    statusText = "Waiting for players to join...";
    startButtonTitle = "Need atleast 2 players to start";
  } else if (isHost) {
    statusText = "Press start game to begin!";
    startButtonTitle = "Start";
  } else {
    statusText = "Waiting for the host to start!";
    startButtonTitle = "Only host can start";
  }

  function handleCopyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleStartGame() {
    send({ type: "START_GAME" });
  }

  return (
    <div className="lobby-page">
      {/* Back button */}
      <button onClick={leaveLobby} className="exit-lobby-btn">
        <FaArrowLeft />
        Exit Lobby
      </button>

      <div className="waiting-room-container">
        {/* Header */}
        <div className="waiting-room-header">
          <div className="people-icon">
            <MdPeopleAlt />
          </div>
          <h1>Waiting Room</h1>
          <p>{statusText}</p>
        </div>

        {/* Invite code display */}
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
          title={startButtonTitle}
          className={`start-game-btn ${canStart && isHost ? "active" : ""}`}
          disabled={!canStart || !isHost}
          onClick={handleStartGame}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
