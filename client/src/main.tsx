import React, { FC } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import { PlayerProvider } from "./contexts/PlayerContext";
import { ServerProvider } from "./contexts/ServerContext";

import App from "./components/App";

import "./scss/index.scss";

// could be called "ContextsProvider" in fact...
const Contexts: FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ServerProvider>
            <PlayerProvider>{children}</PlayerProvider>
        </ServerProvider>
    );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <HashRouter>
            <Contexts>
                <App />
            </Contexts>
        </HashRouter>
    </React.StrictMode>
);
