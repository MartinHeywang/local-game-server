import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { useConnection, useSocket } from "./ServerContext";

import { models } from "local-game-server-types";

type Player = models.Player;
type OwnPlayer = models.OwnPlayer;

interface ContextValue {
    player: Player | null | undefined;
    join: (username: string) => Promise<void>;
    edit: (username: string) => Promise<void>;
    ready: (ready?: boolean) => Promise<void>;
    quit: () => Promise<void>;
}

const defaultFn = () => {
    throw new Error("Can't use properties of the PlayerContext where it is not available.");
};

const PlayerContext = React.createContext<ContextValue>({
    player: null,
    join: defaultFn,
    edit: defaultFn,
    ready: defaultFn,
    quit: defaultFn,
});
const { Provider, Consumer } = PlayerContext;

export const PLAYER_STORAGE_KEY = "player-key";

const PlayerProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [player, setPlayer] = useState<OwnPlayer | null | undefined>();
    const privateKey = useRef<string>();

    const connection = useConnection();
    const { socket } = useSocket();

    // fetch an existing player from the local storage
    useEffect(() => {
        if (player) return;
        if (!connection || !socket) return;

        const storedKey = localStorage.getItem(PLAYER_STORAGE_KEY);
        if (!storedKey) return;

        privateKey.current = storedKey;

        socket.emit("player:link", storedKey);
    }, [connection]);

    useEffect(() => {
        if (!socket) return;

        const handle = (player: Player | null) => {
            setPlayer(old => {

                // the given player might be null (for example on quit)
                if(!player) return player;

                // if the private key is not given in the event
                // we check if we already have one in the old object
                // and then if we stored some key in the ref dedicated to that
                //
                // note: the private key of the old object and the one in the ref are not necessarily equal
                // because the ref is also a way to temp its value for example when linking the player
                // from the local storage
                const key = player?.privateKey || old!.privateKey || privateKey?.current!;

                return {
                    ...player,
                    privateKey: key,
                };
            });
        };

        socket.on("player:update", handle);

        return () => {
            socket.off("player:update", handle);
        };
    }, [socket]);

    useEffect(() => {
        privateKey.current = player?.privateKey;

        if (player === undefined) return;
        if (player === null) return localStorage.removeItem(PLAYER_STORAGE_KEY);

        localStorage.setItem(PLAYER_STORAGE_KEY, player.privateKey);
    }, [player]);

    useEffect(() => {
        function handler(event: BeforeUnloadEvent) {
            if (!player) return;

            // putting whatever in here makes the tab closing confirmation box show up
            // be happy!
            event.returnValue = "(^_^)";
        }

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    function checkSocketElseThrowError() {
        if (socket && socket.connected) return;
        throw new Error("The socket is not initialized or not properly connected.");
    }

    async function join(username: string) {
        checkSocketElseThrowError();
        socket!.emit("player:join", username);
    }

    async function edit(newUsername: string) {
        checkSocketElseThrowError();
        socket!.emit("player:edit", newUsername);
    }

    async function ready(ready?: boolean) {
        checkSocketElseThrowError();

        // pass the ready argument in the event
        // but if undefined, pass the opposite of the current state
        // but if "player" is undefined, pass true
        socket!.emit("player:ready", ready ?? player?.status === "ready" ?? true);
    }

    async function quit() {
        checkSocketElseThrowError();
        socket!.emit("player:quit");
    }

    return <Provider value={{ player, join, edit, ready, quit }}>{children}</Provider>;
};

const usePlayer = () => useContext(PlayerContext);

export { PlayerContext, PlayerProvider, Consumer as PlayerConsumer, usePlayer };
