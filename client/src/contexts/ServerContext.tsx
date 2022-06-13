import React, { Context, FC, useContext, useEffect, useRef, useState } from "react";
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

    open: (pin: string, force?: boolean) => Promise<void>;
    close: () => Promise<void>;
};

const ServerContext = React.createContext<ContextValue>({
    connection: null,
    socket: null,
    open: async () => {},
    close: async () => {},
});
const { Provider, Consumer } = ServerContext;

const PIN_STORAGE_KEY = "server-pin";

const ServerProvider: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<Connection | null | undefined>();
    const [socket, setSocket] = useState<Socket | null | undefined>();

    // the only reason why this ref is here: (only valid in dev)
    // to prevent strict mode from initializing sockets twice
    const opening = useRef(false);

    const [urlParams] = useSearchParams();

    useEffect(() => {
        if (connection) return;
        if (urlParams.has("pin")) return;
        if (opening.current === true) return;

        const pin = localStorage.getItem(PIN_STORAGE_KEY);
        if (!pin) return;

        console.log("trying to connect using the local storage");

        open(pin);
    }, []);

    useEffect(() => {
        if (connection) return;
        if (opening.current === true) return;

        const pin = urlParams.get("pin");
        if (pin === null) return;

        console.log("trying to connect using the url params");

        open(pin);
    }, []);

    useEffect(() => {
        // difference b/w undefined und null here:
        // undefined = literally not defined so the state has just been initialized for example
        // null = the connection has ended, so in this case remove the entry from the local storage
        if (connection === undefined) return;
        if (connection === null) return localStorage.removeItem(PIN_STORAGE_KEY);

        localStorage.setItem(PIN_STORAGE_KEY, connection.pin);
    }, [connection]);

    async function open(pin: string, force?: boolean) {
        console.log(`call to 'open' method with pin ${pin}`);
        console.log(`Currently opening: ${opening.current}`);
        console.log(socket);

        if (opening.current === true) return;
        if (socket && socket.connected) {
            if (force === true) {
                close();
            } else return;
        }

        console.log("opening a new socket...");
        opening.current = true;

        const connection = createConnectionObjFromPin(pin);

        const socketInfo = await fetch(`${connection.url}/get-socket-info`)
            .then(res => res.json())
            .catch(() => {
                // 'change' the error message to a user-friendly message
                throw new Error("Serveur indisponible");
            });
        if (socketInfo === null) return;

        const address: string = socketInfo.address;
        const port: number = socketInfo.port;

        const instance = io(`http://${address}:${port}`).connect();

        setConnection(connection);
        setSocket(instance);
        opening.current = false;
    }

    async function close() {
        if (!socket) return;

        socket.disconnect();
        setSocket(null);
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
};

export { ServerContext, ServerProvider, Consumer as ServerConsumer };
