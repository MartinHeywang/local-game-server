import React, { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServerConnection } from "../contexts/ServerContext";

import Page from "./Page";
import Player from "./Player";

import "../scss/PlayerPage.scss";

interface Player {
    id: string;
    ip: string;
    username: string;
    connectionTime: Date;
}

const PlayersPage: FC = () => {
    const navigate = useNavigate();
    const { connection } = useServerConnection();
    const [players, setPlayers] = useState<Player[]>([]);

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
                const response = await fetch(`${connection.url}/watch-players`);
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

    function join(event: React.FormEvent) {
        event.preventDefault();

        const username = usernameField.current!.value;

        fetch(`${connection!.url}/register-player`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
        })
            .then(res => {
                // throw the Response if !ok
                if(!res.ok) throw res;
                return res.json();
            })
            .then(json => {
                console.log("Registered player");
                console.log(json);
            })
            .catch(err => {
                // looks ridiculous...
                // but matches all external errors
                if(err instanceof Error) {
                    errorParagraph.current!.textContent = "Erreur interne."
                }

                // if the server returned an error
                if(err instanceof Response) {
                    err.json().then(error => {
                        errorParagraph.current!.textContent = error.message;
                    })
                }
            });
    }

    return (
        <Page>
            <h1 className="PlayersPage__title">Joueurs</h1>
            <h2>Joueurs connectés</h2>
            {players.length >= 1 ? <ul className="PlayersPage__players">
                {players.map(player => {
                    return <Player player={player} key={player.id}></Player>
                })}
            </ul> : <p>Aucun joueur n'a rejoint la partie actuellement.</p>}

            <h2>Rejoindre</h2>
            <form className="PlayersPage__join-form" onSubmit={join}>
                <label htmlFor="players-page-join-form-username">Pseudo:</label>
                <input type="text" id="players-page-join-form-username" ref={usernameField} />
                <button>Rejoindre!</button>
            </form>
            <p className="PlayersPage__join-form-error" ref={errorParagraph}></p>
        </Page>
    );
};

export default PlayersPage;
