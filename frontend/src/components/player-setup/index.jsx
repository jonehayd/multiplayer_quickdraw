import { useState } from "react";
import "./styles.css";
import { FaPencil } from "react-icons/fa6";
import ToggleGroup from "../ui/toggle-group";

export default function PlayerSetup({ handleAction }) {
  const [displayName, setDisplayName] = useState("");
  const [lobbyType, setLobbyType] = useState("public");
  const [inviteCode, setInviteCode] = useState("");

  const isNameValid = displayName.trim().length > 0;

  function onCreateLobby() {
    handleAction({
      actionType: "create",
      displayName,
      lobbyType,
    });
  }

  function onJoinWithCode() {
    handleAction({
      actionType: "joinCode",
      displayName,
      inviteCode,
    });
  }

  function onJoinRandom() {
    handleAction({
      actionType: "joinRandom",
      displayName,
    });
  }

  return (
    <div className="container">
      {/* Game heading */}
      <div className="heading">
        <div className="icon-wrapper">
          <FaPencil />
        </div>
        <h1>Quick Draw Battle</h1>
        <h2>Enter your display name and make or join a lobby</h2>
      </div>

      {/* Name Form */}
      <div className="name-form">
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={16}
          autoFocus
        />
      </div>

      {/* Lobby Actions */}
      <div className="lobby-actions">
        {/* Create Lobby */}
        <div className="lobby-section">
          <h3>Create Lobby</h3>

          <div className="toggle">
            <ToggleGroup
              value={lobbyType}
              onChange={setLobbyType}
              options={[
                { label: "Public", value: "public" },
                { label: "Private", value: "private" },
              ]}
            />
          </div>

          <button
            className="create-lobby-btn"
            disabled={!isNameValid}
            onClick={onCreateLobby}
            type="button"
          >
            Make Lobby
          </button>
        </div>

        {/* Join Lobby */}
        <div className="lobby-section">
          <h3>Join Lobby</h3>

          <input
            type="text"
            placeholder="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            maxLength={10}
          />

          <button
            className="create-lobby-btn"
            disabled={!isNameValid || !inviteCode.trim()}
            onClick={onJoinWithCode}
            type="button"
          >
            Join with Code
          </button>

          <div className="divider">or</div>

          <button
            className="create-lobby-btn"
            disabled={!isNameValid}
            onClick={onJoinRandom}
            type="button"
          >
            Join Random Lobby
          </button>
        </div>
      </div>

      {/* How to play */}
      <div className="how-to-play">
        <p>How to play:</p>
        <ul>
          <li>Draw the word shown on screen</li>
          <li>AI will try to guess your drawing</li>
          <li>First to 6 rounds wins the game!</li>
        </ul>
      </div>
    </div>
  );
}
