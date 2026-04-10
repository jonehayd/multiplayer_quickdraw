import { useState } from "react";
import { useLobbyContext } from "../../contexts/LobbyContext";
import "./styles.css";
import ToggleGroup from "../ui/toggle-group";

export default function PlayerSetup() {
  const { handleAction } = useLobbyContext();

  const [displayName, setDisplayName] = useState("");
  const [lobbyType, setLobbyType] = useState("public");
  const [joinError, setJoinError] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const isNameValid = displayName.trim().length > 0;

  function onCreateLobby() {
    handleAction({
      actionType: "create",
      displayName,
      isPublic: lobbyType === "public",
    });
  }

  async function onJoinWithCode() {
    try {
      setInviteCodeError("");
      await handleAction({
        actionType: "joinCode",
        displayName,
        inviteCode,
      });
    } catch (err) {
      setInviteCodeError(err.message);
    }
  }

  async function onJoinRandom() {
    try {
      setJoinError("");
      await handleAction({
        actionType: "joinRandom",
        displayName,
      });
    } catch (err) {
      setJoinError(err.message);
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-glow setup-glow-top" />
      <div className="setup-glow setup-glow-bottom" />

      <main className="setup-main">
        {/* Hero */}
        <div className="setup-hero">
          <div className="setup-hero-inner">
            <div className="setup-icon-wrapper">
              <span className="material-symbols-outlined">edit</span>
            </div>
            <h1 className="setup-title gradient-title">Quick Draw Battle</h1>
          </div>
          <p className="setup-subtitle">
            Fast strokes, sharp AI, infinite creativity. Setup your player
            profile and jump into the arena.
          </p>
        </div>

        {/* Main card */}
        <div className="glass-panel setup-card">
          {/* Name input */}
          <div className="setup-name-section">
            <label className="setup-name-label" htmlFor="display-name">
              What&rsquo;s your artist name?
            </label>
            <div className="setup-name-input-wrapper">
              <input
                id="display-name"
                type="text"
                className="setup-name-input"
                placeholder="Enter Nickname..."
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setJoinError("");
                }}
                maxLength={16}
                autoFocus
              />
              <span className="material-symbols-outlined setup-name-icon">
                person
              </span>
            </div>
          </div>

          {/* Bento grid */}
          <div className="setup-bento">
            {/* Create Lobby */}
            <div className="setup-section">
              <div className="setup-section-header">
                <h3>Create Lobby</h3>
                <p>Host your own room and invite friends.</p>
              </div>
              <ToggleGroup
                value={lobbyType}
                onChange={setLobbyType}
                options={[
                  { label: "Public", value: "public" },
                  { label: "Private", value: "private" },
                ]}
              />
              <button
                className="btn-primary setup-action-btn"
                disabled={!isNameValid}
                onClick={onCreateLobby}
                type="button"
              >
                <span className="material-symbols-outlined">add_circle</span>
                CREATE LOBBY
              </button>
            </div>

            {/* Join Lobby */}
            <div className="setup-section">
              <div className="setup-section-header">
                <h3>Join Lobby</h3>
                <p>Got a code? Enter it here to join.</p>
              </div>
              <input
                type="text"
                className="setup-code-input"
                placeholder="Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                maxLength={10}
              />
              <button
                className="setup-secondary-btn"
                disabled={!isNameValid || !inviteCode.trim()}
                onClick={onJoinWithCode}
                type="button"
              >
                <span className="material-symbols-outlined">meeting_room</span>
                JOIN WITH CODE
              </button>
              {inviteCodeError && (
                <p className="setup-error">{inviteCodeError}</p>
              )}
            </div>
          </div>

          {/* Join Random */}
          <div className="setup-random-section">
            <button
              className="setup-random-btn"
              disabled={!isNameValid}
              onClick={onJoinRandom}
              type="button"
            >
              <span className="material-symbols-outlined setup-bolt">bolt</span>
              JOIN RANDOM BATTLE
              <span className="material-symbols-outlined setup-bolt">bolt</span>
            </button>
            {joinError && <p className="setup-error">{joinError}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

