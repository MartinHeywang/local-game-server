import { OwnPlayer, Player } from "../models";

export interface ClientToServerEvents {
    "player:watch": (watching: boolean) => void;

    "player:join": (username: string) => void;
    "player:edit": (username: string) => void;
    "player:link": (privateKey: string) => void;
    "player:quit": () => void;

    "player:ready": (ready?: boolean) => void;
}

export interface ServerToClientEvents {
    "player:count": (count: number) => void;

    "player:update": (player: OwnPlayer | Player | null) => void;
    "player:error": (msg: string) => void;
}
