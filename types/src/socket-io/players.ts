export interface ClientToServerEvents {
    "player:watch": (watching: boolean) => void;

    "player:join": (username: string) => void;
    "player:edit": (username: string) => void;
    "player:link": (privateKey: string) => void;
    "player:quit": () => void;

    "player:ready": () => void;
}

export interface ServerToClientEvents {
    "player:count": (count: number) => void;
}
