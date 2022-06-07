import React, { FC, useContext, useEffect, useState } from "react";
import { useServerConnection } from "./ServerContext";

export interface Player {
    id: string;
    ip: string;
    username: string;
    connectionTime: Date;
}

// special kind of player that has a "private key"
// this private key is given to the client that made the request to join and is never given elsewhere
// used for sensitive actions / actions that can only be done from himself
type OwnPlayer = Player & { privateKey: string };

interface ContextValue {
    player: Player | null | undefined;
    join: (username: string) => Promise<void>;
    edit: (username: string) => Promise<void>;
    quit: () => Promise<void>;
}

const PlayerContext = React.createContext<ContextValue>({
    player: null,
    join: async () => {},
    edit: async () => {},
    quit: async () => {},
});
const { Provider, Consumer } = PlayerContext;

export const PLAYER_STORAGE_KEY = "player";

const PlayerProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [player, setPlayer] = useState<OwnPlayer | null | undefined>();
    const { connection } = useServerConnection();

    // fetch an existing player from the local storage
    useEffect(() => {
        if (player) return;
        if (!connection) return;

        const storageValue = localStorage.getItem(PLAYER_STORAGE_KEY);
        if (!storageValue) return;

        const storedPlayer: OwnPlayer = JSON.parse(storageValue);
        if(!storedPlayer) return;

        console.log("stored player:");
        console.log(storedPlayer);

        fetch(`${connection!.url}/players/get-from-id/${storedPlayer.id}`).then(res => {
            if (!res.ok) throw res;

            setPlayer(storedPlayer);
        }).catch(err => {
            if(err instanceof Response) {
                const res = err;
                
                if(res.status === 404) {
                    localStorage.removeItem(PLAYER_STORAGE_KEY);
                }
            }
        })
    }, [connection]);

    useEffect(() => {
        if(player === undefined) return;

        console.log("updating local storage player to:")
        console.log(player);

        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
    }, [player]);

    useEffect(() => {
        function handler(event: BeforeUnloadEvent) {
            if(!player) return;

            // putting whatever in here makes the tab closing confirmation box show up
            // be happy!
            event.returnValue = "(^_^)";
        }

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    async function join(username: string) {
        const res = await fetch(`${connection!.url}/players/join`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
        });
        // throw the Response if !ok
        if (!res.ok) throw res;
        const json: OwnPlayer = await res.json();
        setPlayer(json);
    }

    async function edit(newUsername: string) {
        if (!player) return;

        return fetch(`${connection!.url}/players/edit`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ privateKey: player.privateKey, username: newUsername }),
        }).then(res => {
            if (!res.ok) throw res;
        });
    }

    async function quit() {
        if (!player) return;

        return fetch(`${connection!.url}/players/quit`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ privateKey: player.privateKey }),
        }).then(res => {
            if (!res.ok) throw res;
            setPlayer(null);
        });
    }

    return <Provider value={{ player, join, edit, quit }}>{children}</Provider>;
};

const usePlayer = () => useContext(PlayerContext);

export { PlayerContext, PlayerProvider, Consumer as PlayerConsumer, usePlayer };
