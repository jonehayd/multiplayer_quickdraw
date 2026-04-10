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
  if (!canStart) {
    statusText = "Need at least 2 players to start";
  } else if (isHost) {
    statusText = "Press Start Battle to begin!";
  } else {
    statusText = "Waiting for the host to start...";
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
      <div className="lobby-glow lobby-glow-tl" />
      <div className="lobby-glow lobby-glow-br" />

      {/* Header */}
      <header className="lobby-header">
        <div className="lobby-header-left">
          <button onClick={leaveLobby} className="lobby-back-btn" title="Exit Lobby">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="lobby-title gradient-title">Quick Draw Battle</span>
        </div>
      </header>

      {/* Main */}
      <main className="lobby-main">
        <div className="lobby-page-heading">
          <h1>Waiting Room</h1>
          <p>Waiting for artists to join the battle arena...</p>
        </div>

        <div className="lobby-bento">
          {/* Left: invite code */}
          <div className="lobby-left-col">
            <div className="glass-panel lobby-code-card">
              <div className="lobby-code-label">
                <span className="material-symbols-outlined">share</span>
                <span>Invite Friends</span>
              </div>
              <h2>Battle Code</h2>
              <div className="lobby-code-display">
                <code className="lobby-code-text">{inviteCode}</code>
                <button
                  className="lobby-copy-btn"
                  onClick={handleCopyInviteCode}
                  title="Copy invite code"
                >
                  <span className="material-symbols-outlined">
                    {copied ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
              <p className="lobby-code-hint">
                Share this code with other players to invite them.
              </p>
            </div>
          </div>

          {/* Right: players */}
          <div className="glass-panel lobby-players-card">
            <div className="lobby-players-header">
              <div>
                <h2>Participants</h2>
                <p>
                  {players.length} / {MAX_PLAYERS} Slots Filled
                </p>
              </div>
            </div>
            <div className="lobby-players-grid">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`lobby-player-row${player.isHost ? " is-host" : ""}`}
                >
                  <div className="lobby-player-avatar">
                    {player.name[0].toUpperCase()}
                  </div>
                  <div className="lobby-player-info">
                    <span className="lobby-player-name">
                      {player.name}
                      {player.isHost && (
                        <span className="lobby-host-badge">Host</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lobby-footer">
          <p className="lobby-status-text">
            <span className="material-symbols-outlined">info</span>
            {statusText}
          </p>
          <button
            className={`lobby-start-btn${canStart && isHost ? " active" : ""}`}
            disabled={!canStart || !isHost}
            onClick={handleStartGame}
          >
            <span className="lobby-start-btn-content">
              <span>Start Battle</span>
              <span className="material-symbols-outlined">play_arrow</span>
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}

