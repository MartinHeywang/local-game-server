import React, { FC, useRef } from "react";
import { PIN_LENGTH, useServerConnection } from "../contexts/ServerContext";

import "../scss/ConnectPage.scss";

const ConnectPage: FC = () => {
    const submitBtn = useRef<HTMLButtonElement>(null);
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
                <input
                    ref={pinField}
                    type="text"
                    id="connect-page-form-pin"
                    onChange={event =>
                        (submitBtn.current!.disabled =
                            event.target.value.length === PIN_LENGTH ? false : true)
                    }
                />

                <button ref={submitBtn} className="ConnectPage__submit" id="connect-page-form-id">
                    Valider
                </button>
            </form>
        </div>
    );
};

export default ConnectPage;
