import React, { FC, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useServerConnection } from "../contexts/ServerContext";

import "../scss/PConnect.scss";

const ConnectPage: FC = () => {
    const pinField = useRef<HTMLInputElement>(null);

    const { connect } = useServerConnection();
    const navigate = useNavigate();

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!pinField.current) return;

        connect("#" + pinField.current.value).then(_ => {
            navigate("/players");
        });
    }

    return (
        <div className="PConnect">
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

                <button className="PConnect__submit" id="connect-page-form-id">
                    Valider
                </button>
            </form>
        </div>
    );
};

export default ConnectPage;
