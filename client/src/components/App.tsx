import React from "react";
import { Link, Route, Routes } from "react-router-dom";

import { ServerProvider } from "../contexts/ServerContext";

import PConnect from "./PConnect";
import PPlayers from "./PPlayers";

function App() {

    return (
        <ServerProvider>
            <Routes>
                <Route path="connect" element={<PConnect />} />
                <Route path="players" element={<PPlayers />} />
                <Route
                    path="/"
                    element={
                        <p>
                            Home page. <Link to="/connect">Connect</Link>
                        </p>
                    }
                />
                <Route
                    path="*"
                    element={
                        <p>
                            404... not found! <Link to="/">Go home</Link>
                        </p>
                    }
                />
            </Routes>
        </ServerProvider>
    );
}

export default App;
