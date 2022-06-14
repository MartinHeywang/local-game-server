import { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection, useSocket } from "../contexts/ServerContext";

import Page from "./Page";

import "../scss/PHub.scss";
import { usePlayer } from "../contexts/PlayerContext";
import CPlayer from "./CPlayer";

const PHub: FC = () => {
    const connection = useConnection();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [playersCount, setPlayersCount] = useState<number>();
    const { player, join, edit, quit } = usePlayer();

    const playerUsernameField = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // must have an active connection
        if (connection) return;

        navigate("/connect");
    }, [connection]);

    useEffect(() => {
        if (!socket) return;

        socket.emit("player:watch", true);
        return () => {
            socket.emit("player:watch", false);
        };
    }, [connection]);

    useEffect(() => {
        if (!socket) return;

        const handle = (count: number) => setPlayersCount(count);

        socket.on("player:count", handle);

        return () => {
            socket.off("player:count", handle);
        };
    });

    function submitPlayer(event: React.FormEvent) {
        event.preventDefault();

        const username = playerUsernameField.current!.value;

        // either call join() or edit() based on the current state of the player
        (!player ? join : edit)(username);
    }

    return (
        <Page className="PHub">
            <header className="PHub__top-bar">
                <h1>Hub</h1>
                <span className="PHub__server-pin">PIN: {connection?.pin}</span>
            </header>
            <div className="PHub__main-card">
                <div className="PHub__player-zone">
                    <h2>Joueur</h2>

                    <p className="PHub__player-status">
                        Tu <strong>{player ? "es inscrit" : "n'est pas inscrit"}</strong> en tant que
                        joueur.
                    </p>

                    {player && <CPlayer player={player}></CPlayer>}

                    <form onSubmit={submitPlayer}>
                        <label htmlFor="hub-page-form-player-username">
                            {player ? "Modifier le pseudo:" : "Pseudo:"}
                        </label>
                        <input id="hub-page-form-player-username" ref={playerUsernameField} />
                        <button>{player ? "Modifier!" : "Rejoindre!"}</button>
                    </form>


                    {player && <button onClick={() => quit()}>Quitter {":("}</button>}
                </div>
                <div className="PHub__game-zone">
                    <h2>Jouer!</h2>
                    <p>Fonctionnalité (importante) à venir...</p>
                </div>
            </div>
            <p className="PHub__players-count">
                {playersCount || 0}{" "}
                {/* plural */}
                {["joueur", "connecté"].map(word => {
                    if ((playersCount || 0) > 1) {
                        return word + "s" + " ";
                    } else return word + " ";
                })}{" "}
                au serveur en ce moment.
            </p>
        </Page>
    );
};

export default PHub;
