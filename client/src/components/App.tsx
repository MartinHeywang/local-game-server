import React from "react";
import { Link, Route, Routes } from "react-router-dom";

import PConnect from "./PConnect";
import PDisconnect from "./PDisconnect";
import PHub from "./PHub";

function App() {

    return (
        <Routes>
            <Route path="connect" element={<PConnect />} />
            <Route path="disconnect" element={<PDisconnect />} />
            <Route path="hub" element={<PHub />} />
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
