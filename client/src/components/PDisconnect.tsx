import React, { FC } from "react";
import { Link } from "react-router-dom";
import Page from "./Page";

const PDisconnect: FC = () => {
    return (
        <Page>
            <p style={{ textAlign: "center" }}>
                Tu as perdu la connection avec le serveur. On te propose de{" "}
                <Link to="/connect">revenir à la page de connexion.</Link>
            </p>
        </Page>
    );
};

export default PDisconnect;
