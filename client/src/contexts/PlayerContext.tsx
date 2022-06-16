import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { useConnection, useSocket } from "./ServerContext";

import { models, socketIO } from "local-game-server-types";

type Player = models.Player;
type OwnPlayer = models.OwnPlayer;

interface ContextValue {
    player: Player | null | undefined;
    join: (username: string) => Promise<[OwnPlayer]>;
    edit: (username: string) => Promise<[Player]>;
    ready: (ready?: boolean) => Promise<[Player]>;
    quit: () => Promise<[null]>;
}

const errorFn = (name: string) => {
    throw new Error(`Can't use property ${name} of the PlayerContext is not provided`);
};

const PlayerContext = React.createContext<ContextValue>({
    player: null,
    join: () => errorFn("join"),
    edit: () => errorFn("edit"),
    ready: () => errorFn("ready"),
    quit: () => errorFn("quit"),
});
const { Provider, Consumer } = PlayerContext;

export const PLAYER_STORAGE_KEY = "player-key";

const PlayerProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [player, setPlayer] = useState<OwnPlayer | null | undefined>();
    const privateKey = useRef<string>();

    const connection = useConnection();
    const { socket, emitWithResponse } = useSocket();

    // fetch an existing player from the local storage
    useEffect(() => {
        if (player) return;
        if (!socket || !socket.connected) return;

        const storedKey = localStorage.getItem(PLAYER_STORAGE_KEY);
        if (!storedKey) return;

        privateKey.current = storedKey;

        console.log(`trying to link socket of id '${socket.id}' to player of key '${storedKey}'`);
        socket.emit("player:link", storedKey);
    }, [connection]);

    useEffect(() => {
        if (!socket) return;

        const handle = (player: Player | null) => {
            setPlayer(old => {
                // the given player might be null (for example on quit)
                if (!player) return player;

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

    useEffect(() => {
        if (!socket || !socket.connected) return;

        const handle = (message: string) => {
            console.log(`Le serveur a envoyé un 'player:error'`);
            console.log(message);
        };

        socket.on("player:error", handle);
        return () => {
            socket.off("player:error", handle);
        };
    });

    function join(username: string) {
        const promise = emitWithResponse<[OwnPlayer]>(
            { req: "player:join", res: "player:update", err: "player:error" },
            [username]
        );

        promise.then(([player]) => {
            console.log("Player successfully joined");
            console.log(player);
        });

        promise.catch(message => {
            console.log("Error while joining");
            console.log(message);
        });

        return promise;
    }

    function edit(newUsername: string) {
        return emitWithResponse<[Player]>(
            { req: "player:edit", res: "player:update", err: "player:error" },
            [newUsername]
        );
    }

    function ready(ready?: boolean) {
        // pass the ready argument in the event
        // but if undefined, pass the opposite of the current state
        // but if "player" is undefined, pass true
        return emitWithResponse<[Player]>(
            { req: "player:ready", res: "player:update", err: "player:error" },
            [ready ?? player?.status === "ready" ?? true]
        );
    }

    function quit() {
        return emitWithResponse<[null]>(
            { req: "player:quit", res: "player:update", err: "player:error" },
            []
        );
    }

    return <Provider value={{ player, join, edit, ready, quit }}>{children}</Provider>;
};

const usePlayer = () => useContext(PlayerContext);

export { PlayerContext, PlayerProvider, Consumer as PlayerConsumer, usePlayer };
