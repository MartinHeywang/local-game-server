import React, { Context, FC, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

export type Connection = {
    pin: string;
    ip: [number, number, number, number, number];
    url: string;
};

export type ContextValue = {
    connection: Connection | null | undefined;
    socket: Socket | null | undefined;

    open: (playerId: string) => Promise<void>;
    close: () => Promise<void>;
};

const ServerContext = React.createContext<ContextValue>({
    connection: null,
    socket: null,
    open: async () => {},
    close: async () => {},
});
const { Provider, Consumer } = ServerContext;

const CONNECTION_STORAGE_KEY = "server-connection";

const ServerProvider: FC<{ children?: React.ReactNode }> = ({ children }) => {

    const [connection, setConnection] = useState<Connection | null | undefined>();
    const [socket, setSocket] = useState<Socket | null | undefined>();

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

    async function open(pin: string) {
        const connection = createConnectionObjFromPin(pin);
        setConnection(connection);

        const socketInfo = await fetch(`${connection.url}/get-socket-info`).then(res => res.json());
        if (socketInfo === null) return;

        const address: string = socketInfo.address;
        const port: number = socketInfo.port;

        const instance = io(`http://${address}:${port}`).connect();
        setSocket(instance);
    }

    async function close() {
        if (!socket) return;

        socket.disconnect();
        setSocket(null);
    }

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
        if (pin.charAt(0) !== "#") throw new Error("Un pin doit commencer avec un '#'.");

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
        };

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

    return <Provider value={{ connection, socket, open, close }}>{children}</Provider>;
};

export const useConnection = () => useContext(ServerContext)["connection"];
export const useSocket = () => {
    // the type assertion here "removes" the 'connection' property to the eye of TypeScript
    // tough it will be available at runtime anyway
    return useContext(ServerContext) as Exclude<ContextValue, "connection">;
}

export { ServerContext, ServerProvider, Consumer as ServerConsumer };
