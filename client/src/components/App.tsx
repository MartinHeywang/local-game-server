import React from "react";
import { Route, Routes } from "react-router-dom";

import { ServerProvider } from "../contexts/ServerContext";

import ConnectPage from "./ConnectPage";
import PlayersPage from "./PlayersPage";

function App() {

    return (
        <ServerProvider>
            <Routes>
                <Route path="connect" element={<ConnectPage />} />
                <Route path="players" element={<PlayersPage />} />
                <Route path="*" element={<p>Base route 404.</p>} />
            </Routes>
        </ServerProvider>
    );
}

export default App;
