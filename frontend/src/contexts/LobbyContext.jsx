import { createContext, useContext } from "react";

export const LobbyContext = createContext(null);

export function useLobbyContext() {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error("useLobbyContext must be used within LobbyProvider");
  }
  return context;
}
