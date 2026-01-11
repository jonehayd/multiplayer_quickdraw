async function request(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function createLobby({ displayName, isPublic }) {
  return request("/api/lobby/create", { displayName, isPublic });
}

export function joinLobbyByCode({ displayName, inviteCode }) {
  return request("/api/lobby/join", { displayName, inviteCode });
}

export function joinRandomLobby({ displayName }) {
  return request("/api/lobby/join-random", { displayName });
}
