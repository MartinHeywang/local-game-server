import React, { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServerConnection } from "../contexts/ServerContext";

import Page from "./Page";
import CPlayer from "./CPlayer";

import { Player, usePlayer } from "../contexts/PlayerContext";

import "../scss/PPlayers.scss";

const PlayersPage: FC = () => {
    const navigate = useNavigate();
    const { connection } = useServerConnection();
    const [players, setPlayers] = useState<Player[]>([]);

    const { player, join, edit, quit } = usePlayer();

    const usernameField = useRef<HTMLInputElement>(null);
    const errorParagraph = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        // the client must have a valid connection active
        if (connection) return;

        navigate(`/connect`);
    }, []);

    useEffect(() => {
        if (!connection) return;

        (async () => {
            try {
                const response = await fetch(`${connection.url}/players/watch`);
                if (!response.ok) throw Error(response.statusText);

                for (const reader = response.body!.getReader(); ; ) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const data: Player[] = JSON.parse(new TextDecoder().decode(value));
                    setPlayers(data);
                }
            } catch (err) {
                console.log("Error occurred while watching.");
                console.log(err);
            }
        })();
    }, [connection]);

    useEffect(() => {
        if(!errorParagraph.current) return;

        errorParagraph.current.textContent = "";
    }, [player])

    function submitJoin(event: React.FormEvent) {
        event.preventDefault();

        const username = usernameField.current!.value;

        join(username).catch(err => {
            // looks ridiculous...
            // but matches all external errors (e.g NetworkError)
            if (err instanceof Error) {
                errorParagraph.current!.textContent = "Erreur interne.";
            }

            // if the server returned an error
            if (err instanceof Response) {
                err.json().then(error => {
                    errorParagraph.current!.textContent = error.message;
                });
            }
        });
    }

    function submitEdit(event: React.FormEvent) {
        event.preventDefault();

        const username = usernameField.current!.value;

        edit(username).catch(err => {
            // looks ridiculous...
            // but matches all external errors (e.g NetworkError)
            if (err instanceof Error) {
                errorParagraph.current!.textContent = "Erreur interne.";
            }

            // if the server returned an error
            if (err instanceof Response) {
                err.json().then(error => {
                    errorParagraph.current!.textContent = error.message;
                });
            }
        });
    }

    return (
        <Page className="PPlayers">
            <h1 className="PPlayers__title">Joueurs</h1>
            <h2>Rejoindre</h2>
            <form className="PPlayers__join-form" onSubmit={event => player === null ? submitJoin(event) : submitEdit(event)}>
                <label htmlFor="players-page-join-form-username">Pseudo:</label>
                <input type="text" id="players-page-join-form-username" ref={usernameField} />
                <button>{!player ? "Rejoindre!" : "Changer"}</button>
            </form>
            {player !== null && <button onClick={quit}>Quitter</button>}
            <p className="PPlayers__join-form-error" ref={errorParagraph}></p>
            <h2>Joueurs connectés ({players.length})</h2>
            {players.length >= 1 ? (
                <ul className="PPlayers__players">
                    {players.map(player => {
                        return <CPlayer player={player} key={player.id}></CPlayer>;
                    })}
                </ul>
            ) : (
                <p className="PPlayers__no-player">Aucun joueur n'a rejoint la partie actuellement.</p>
            )}
        </Page>
    );
};

export default PlayersPage;
