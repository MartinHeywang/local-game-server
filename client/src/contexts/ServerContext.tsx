import React, { FC, useContext, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

export type Connection = {
    pin: string;
    ip: [number, number, number, number, number];
    url: string;
    connectionTime: Date;
};

export type ContextValue = {
    connection: Connection | null | undefined;
    connect: (pin: string) => Promise<Connection | null>;
};

const ServerContext = React.createContext<ContextValue>({ connection: null, connect: async () => null });
const { Provider, Consumer } = ServerContext;

const CONNECTION_STORAGE_KEY = "server-connection";

const ServerProvider: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<Connection | null | undefined>();

    const [urlParams] = useSearchParams();

    useEffect(() => {
        if (connection) return;
        if (urlParams.has("pin")) return;

        const storageValue = localStorage.getItem(CONNECTION_STORAGE_KEY);
        if (!storageValue) return;
        const storedConnection: Connection = JSON.parse(storageValue);

        checkConnection(storedConnection).then(valid => {
            if (valid) setConnection(storedConnection);
            else localStorage.removeItem(CONNECTION_STORAGE_KEY);
        });
    }, []);

    useEffect(() => {
        if (connection) return;

        console.log("trying to connect to server trough url search param");

        const pin = urlParams.get("pin");
        if (pin === null) return;

        console.log(`Pin: ${pin}`);

        try {
            const newConnection = createConnectionObjFromPin(pin);
            console.log(newConnection);

            checkConnection(newConnection).then(valid => {
                if (!valid) return;
                setConnection(newConnection);
            });
        } catch {}
    }, []);

    useEffect(() => {
        if (connection === undefined) return;

        localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(connection));
    }, [connection]);

    async function checkConnection(connection: Connection) {
        // 7 seconds timeout - 30 is too long
        const timeoutController = new AbortController();
        const timeout = setTimeout(() => timeoutController.abort(), 7_000);

        try {
            const ok = await fetch(connection.url, { signal: timeoutController.signal }).then(res => {
                clearTimeout(timeout);
                return res.ok;
            });
            return ok;
        } catch {
            return false;
        }
    }

    function createConnectionObjFromPin(pin: string) {

        if(pin.charAt(0) !== "#") throw new Error("A pin should start with a '#'");

        // remove the # at the beginning and split between the dots
        const ipString = pin.substring(1);
        const ip = ipString.split(".").map(part => parseInt(part));

        // 5 = IPv4 normal length + port value
        if (ip.length !== 5) throw new Error(`PIN invalide`);

        const url = `http://${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}:${ip[4]}`;

        const newConnection: Connection = {
            pin,
            ip: ip as Connection["ip"],
            url,
            connectionTime: new Date(),
        };

        return newConnection;
    }

    async function connect(pin: string) {
        console.log(`Tentative de connexion au serveur %c${pin}`, "color: lightblue");

        const newConnection = createConnectionObjFromPin(pin);

        console.log(`URL du serveur: %c"${newConnection.url}"`, "color: lightblue");

        if (await checkConnection(newConnection)) setConnection(newConnection);

        return newConnection;
    }

    useEffect(() => {
        // !! to infer type to boolean (double inverse)
        const connected = !!connection;
        console.log(
            `SERVER CONNECTION STATUS: %c${connected ? "CONNECTED" : "DISCONNECTED"}`,
            `color: ${connected ? "lightgreen" : "darkred"}; font-weight: bold`
        );
    }, [connection]);

    return <Provider value={{ connection, connect }}>{children}</Provider>;
};

export const useServerConnection = () => useContext(ServerContext);

export { ServerContext, ServerProvider, Consumer as ServerConsumer };
