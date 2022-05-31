import React, { FC, useRef } from "react";
import { useServerConnection } from "../contexts/ServerContext";

import "../scss/ConnectPage.scss";

const ConnectPage: FC = () => {
    const pinField = useRef<HTMLInputElement>(null);

    const { connect } = useServerConnection();

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!pinField.current) return;

        connect(pinField.current.value);
    }

    return (
        <div className="ConnectPage">
            <form className="ConnectPage__form" onSubmit={submit}>
                <label>Entre le PIN du serveur:</label>
                <input ref={pinField} type="text" id="connect-page-form-pin" />

                <button
                    className="ConnectPage__submit"
                    id="connect-page-form-id"
                    disabled={pinField.current?.value.length !== 10}
                >
                    Valider
                </button>
            </form>
        </div>
    );
};

export default ConnectPage;
