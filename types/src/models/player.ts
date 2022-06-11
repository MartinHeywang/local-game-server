export interface Player {
    id: string;
    socketId: string | null;
    privateKey: string | undefined;

    username: string;

    status: "idling" | "ready" | "playing";
}

// special kind of player that has a "private key"
// this private key is given to the client that made the request to join and is never given elsewhere
// used for sensitive actions / actions that can only be done from himself
export type OwnPlayer = Player & { privateKey: string };
