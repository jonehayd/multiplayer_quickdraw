import PlayerSetup from "./components/player-setup";
import { LobbyProvider } from "./contexts/LobbyProvider";

export default function Test() {
  return (
    <>
      <LobbyProvider>
        <PlayerSetup />
      </LobbyProvider>
    </>
  );
}
