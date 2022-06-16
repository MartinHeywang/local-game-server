import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { socketIO } from "local-game-server-types";

export type Connection = {
    pin: string;
    ip: [number, number, number, number, number];
    url: string;
};

export type ContextValue = {
    connection: Connection | null | undefined;
    socket: socketIO.OurClientSocket | null | undefined;

    open: (pin: string, force?: boolean) => Promise<void>;
    close: () => Promise<void>;
    throwErrorIfInvalidSocket: () => void;

    // for more details, see declaration inside the provider
    emitWithResponse: <
        T extends Parameters<socketIO.STCEvents[ER]>,
        ES extends keyof socketIO.CTSEvents = keyof socketIO.CTSEvents,
        EE extends Extract<keyof socketIO.STCEvents, `${string}error${string}`> = Extract<
            keyof socketIO.STCEvents,
            `${string}error${string}`
        >,
        ER extends Exclude<keyof socketIO.STCEvents, EE> = Exclude<keyof socketIO.STCEvents, EE>
    >(
        eventsName: {
            req: ES;
            err: EE;
            res: ER;
        },
        eventData: Parameters<socketIO.CTSEvents[ES]>,
        options?: { timeout: number }
    ) => Promise<T extends never ? Parameters<socketIO.STCEvents[ER]> : T>;
};

const errorFn = (name: string) => {
    throw new Error(`Can't use property '${name}' on the ServerContext where it is not provided`);
};

const ServerContext = React.createContext<ContextValue>({
    connection: undefined,
    socket: undefined,

    open: () => errorFn("open"),
    close: () => errorFn("close"),
    throwErrorIfInvalidSocket: () => errorFn("throwErrorIfInvalidSocket"),
    emitWithResponse: () => errorFn("emitWithResponse"),
});
const { Provider, Consumer } = ServerContext;

const PIN_STORAGE_KEY = "server-pin";

const ServerProvider: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<Connection | null | undefined>();
    const [socket, setSocket] = useState<socketIO.OurClientSocket | null | undefined>();

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

        open(pin).catch(_ => {
            console.log(`Failed to connect with pin: %c${pin}`, "color: lightblue; font-weight: bold");
        });
    }, []);

    useEffect(() => {
        if (connection) return;
        if (opening.current === true) return;

        const pin = urlParams.get("pin");
        if (pin === null) return;

        console.log("trying to connect using the url params");

        open(pin).catch(_ => {
            console.log(`Failed to connect with pin: %c${pin}`, "color: lightblue; font-weight: bold");
        });
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
        
        // the force option only works if a socket is already setup and connected
        // not if something else is already trying to connect
        if (opening.current === true) {
            throw new Error("Action impossible. Réessaye dans quelques secondes.");
        }

        if (socket && socket.connected) {
            if (force === true) {
                close();
            } else return;
        }

        opening.current = true;

        try {
            const connection = createConnectionObjFromPin(pin);

            const socketInfo = await fetch(`${connection.url}/get-socket-info`)
                .then(res => res.json())
                .catch(() => {
                    opening.current = false;

                    // 'change' the error message to a user-friendly message
                    throw new Error("Serveur indisponible");
                });
            if (socketInfo === null) return;

            const address: string = socketInfo.address;
            const port: number = socketInfo.port;

            const instance: socketIO.OurClientSocket = io(`http://${address}:${port}`).connect();

            setConnection(connection);
            setSocket(instance);
        } catch {}

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

    function throwErrorIfInvalidSocket(
        socket: socketIO.OurClientSocket | null | undefined
    ): asserts socket is socketIO.OurClientSocket {
        if (socket && socket.connected) return;
        throw new Error("The socket is not initialized or not properly connected.");
    }

    function emitWithResponse<
        T extends Parameters<socketIO.STCEvents[ER]>,
        // generics for event names

        // all client to server events are possible
        ES extends keyof socketIO.CTSEvents,
        // all server to client events are possible, expect the one given for the error
        ER extends Exclude<keyof socketIO.STCEvents, EE>,
        // only server to client events whose name contain "error"
        EE extends Extract<keyof socketIO.STCEvents, `${string}error${string}`>
    >(
        eventsName: {
            req: ES;
            res: ER;
            err: EE;
        },
        eventData: Parameters<socketIO.CTSEvents[ES]>,
        options = { timeout: 10000 }
    ) {
        type ResponseData = T extends never ? Parameters<socketIO.STCEvents[ER]> : T;

        return new Promise<ResponseData>((resolve, reject) => {
            throwErrorIfInvalidSocket(socket);

            const timeout = setTimeout(() => {
                removeListeners();

                reject("Délai d'attente dépassé");
            }, options.timeout);

            const resolutionHandler = (...data: ResponseData) => {
                removeListeners();

                resolve(data);
            };

            const rejectionHandler = (data: string) => {
                removeListeners();

                // the data is expected to be the error message (as a string)
                reject(data as string);
            };

            const removeListeners = () => {
                clearTimeout(timeout);
                // @ts-ignore
                socket!.off(eventsName.res, resolutionHandler);

                // @ts-ignore
                socket!.off(eventsName.err, rejectionHandler);
            };

            // @ts-expect-error
            // TypeScript complains about the type of the listener registered just here:
            // even though it is completely correct
            // (as well as for the public interface of 'emitWithResponse')
            //
            // note: this is *probably* because eventsName.response is a variable (whose type is an union)
            // rather that the hard coded name of the event (or a variable that could take one value)
            // We are not even able the pass an empty function (no args, return type void) in here!
            socket!.once(eventsName.res, resolutionHandler);

            // @ts-expect-error : same as above
            socket!.once(eventsName.err, rejectionHandler);

            console.log(`emitting (expecting response) ${eventsName.req}`);
            console.log("result:");
            socket!.emit(eventsName.req, ...eventData);
        });
    }

    useEffect(() => {
        // !! to infer type to boolean (double inverse)
        const connected = !!connection;
        console.log(
            `SERVER CONNECTION STATUS: %c${connected ? "CONNECTED" : "DISCONNECTED"}`,
            `color: ${connected ? "lightgreen" : "darkred"}; font-weight: bold`
        );
    }, [connection]);

    return (
        <Provider
            value={{
                connection,
                socket,
                open,
                close,
                throwErrorIfInvalidSocket: () => throwErrorIfInvalidSocket(socket),
                emitWithResponse,
            }}
        >
            {children}
        </Provider>
    );
};

export const useConnection = () => useContext(ServerContext)["connection"];
export const useSocket = () => {
    // the type assertion here "removes" the 'connection' property to the eye of TypeScript
    // tough it will be available at runtime anyway
    return useContext(ServerContext) as Exclude<ContextValue, "connection">;
};

export { ServerContext, ServerProvider, Consumer as ServerConsumer };
