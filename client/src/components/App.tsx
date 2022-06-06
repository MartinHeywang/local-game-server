import React, { FC, useEffect } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { usePlayer } from "../contexts/PlayerContext";

import PConnect from "./PConnect";
import PPlayers from "./PPlayers";

function App() {

    return (
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
    );
}

export default App;
