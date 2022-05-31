import React from "react";
import { Route, Routes } from "react-router-dom";

import { ServerProvider } from "../contexts/ServerContext";

import ConnectPage from "./ConnectPage";

function App() {
    // const [count, setCount] = useState(0);

    // useEffect(() => {
    //     (async () => {
    //         try {
    //             const response = await fetch("http://192.168.1.23:5000/watch");

    //             if (!response.ok) {
    //                 throw Error(response.status.toString());
    //             }

    //             for (const reader = response.body!.getReader(); ; ) {
    //                 const { value, done } = await reader.read();

    //                 if (done) {
    //                     break;
    //                 }

    //                 const newCount = parseInt(new TextDecoder().decode(value));
    //                 setCount(newCount);
    //             }
    //         } catch {
    //             console.log("Error occurred while watching. Connection lost?");
    //         }
    //     })();
    // }, []);

    return (
        <ServerProvider>
            <Routes>
                <Route path="connect" element={<ConnectPage />} />
                <Route path="*" element={<p>Base route 404.</p>} />
            </Routes>
        </ServerProvider>
    );
}

export default App;
