import { FC, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConnection, useSocket } from "../contexts/ServerContext";

import Page from "./Page";

import "../scss/PHub.scss";
import { usePlayer } from "../contexts/PlayerContext";
import CPlayer from "./CPlayer";
import { socketIO } from "local-game-server-types";

const PHub: FC = () => {
    const connection = useConnection();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [playersCount, setPlayersCount] = useState<number>();
    const { player, join, edit, quit, ready } = usePlayer();

    const playerUsernameField = useRef<HTMLInputElement>(null);
    const playerErrorParagraph = useRef<HTMLParagraphElement>(null);

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
    }, []);

    useEffect(() => {
        // on unmount, set the player to be not ready
        return () => {
            if(!player) return;

            ready(false);
        }
    }, [])

    function submitPlayer(event: React.FormEvent) {
        event.preventDefault();

        playerErrorParagraph.current!.textContent = "";

        const username = playerUsernameField.current!.value;

        console.log(`Submit: ${!player ? "joining" : "editing"}`);

        // either call join() or edit() based on the current state of the player
        (!player ? join : edit)(username).catch((message: string) => {
            playerErrorParagraph.current!.textContent = message;
        });
    }

    function submitReady(_: React.MouseEvent<HTMLButtonElement>) {
        ready(); // toggles the state
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
                        <input
                            id="hub-page-form-player-username"
                            ref={playerUsernameField}
                            autoComplete="off"
                        />
                        <button>{player ? "Modifier!" : "Rejoindre!"}</button>
                    </form>

                    <p ref={playerErrorParagraph} className="PHub__player-form-error"></p>

                    {player && <button onClick={() => quit()}>Quitter {":("}</button>}
                </div>
                <div className="PHub__game-zone">
                    <h2>Jouer!</h2>
                    <div className="PHub__rules-box">
                        <p>
                            Avant de commencer, <Link to="/rules">lis les règles en cliquant ici</Link>
                            &nbsp;!
                        </p>
                    </div>
                    {player ? (
                        <>
                            <p className="PHub__player-status">
                                Tu{" "}
                                <strong>
                                    {player.status === "ready" ? "es prêt" : "n'est pas encore prêt"}
                                </strong>{" "}
                                à jouer.
                            </p>
                            <button onClick={submitReady}>
                                {player.status === "ready" ? "Je ne suis plus prêt" : "Je suis prêt!"}
                            </button>
                        </>
                    ) : (
                        <p>
                            Avant de jouer, tu dois inscrire en tant que joueur dans l'encadré de gauche!
                        </p>
                    )}
                </div>
            </div>
            <p className="PHub__players-count">
                {playersCount || 0} {/* plural */}
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
