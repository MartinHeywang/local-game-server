import React, { FC, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConnection, useSocket } from "../contexts/ServerContext";

import "../scss/PConnect.scss";
import Page from "./Page";

const PConnect: FC = () => {
    const pinField = useRef<HTMLInputElement>(null);
    const errorParagraph = useRef<HTMLParagraphElement>(null);

    const connection = useConnection();
    const { open } = useSocket();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!pinField.current) return;

        changeErrorText("");

        setLoading(true);
        open("#" + pinField.current.value, true)
            .then(_ => {
                navigate("/hub");
            })
            .catch(err => {
                changeErrorText(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function changeErrorText(text: string) {
        if(!errorParagraph.current) return;

        errorParagraph.current.textContent = text;
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
                            onChange={() => changeErrorText("")}
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
                            Tu es d??j?? connect?? ?? un serveur! (
                            <span className="PConnect__server-pin">{connection.pin}</span>)<br />
                            <Link to="/hub">Aller au hub</Link>
                        </p>
                    </>
                )}
            </div>
        </Page>
    );
};

export default PConnect;
