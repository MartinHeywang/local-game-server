import React, { FC, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConnection, useSocket } from "../contexts/ServerContext";

import "../scss/PConnect.scss";
import Page from "./Page";

const ConnectPage: FC = () => {
    const pinField = useRef<HTMLInputElement>(null);
    const errorParagraph = useRef<HTMLParagraphElement>(null);

    const connection = useConnection();
    const { open } = useSocket();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!pinField.current) return;

        setLoading(true);
        open("#" + pinField.current.value)
            .then(_ => {
                navigate("/players");
            })
            .catch(err => {
                errorParagraph.current!.textContent = err.message;
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <Page className="PConnect">
            <div className="PConnect__content">
                <form className="PConnect__form" onSubmit={submit}>
                    <label>Entre le PIN du serveur:</label>
                    <div className="PConnect__input-box">
                        #
                        <input
                            ref={pinField}
                            type="text"
                            id="connect-page-form-pin"
                            className="PConnect__input"
                        />
                    </div>
                    <p ref={errorParagraph} className="PConnect__errors"></p>
                    <button className="PConnect__submit" id="connect-page-form-id" disabled={loading}>
                        {loading ? "..." : "Valider"}
                    </button>
                </form>
                {connection && (
                    <>
                        <hr />
                        <p className="PConnect__already-connected">
                            Tu es déjà connecté à un serveur! (
                            <span className="PConnect__server-pin">{connection.pin}</span>)<br />
                            <Link to="/players">Page des joueurs</Link>
                        </p>
                    </>
                )}
            </div>
        </Page>
    );
};

export default ConnectPage;
