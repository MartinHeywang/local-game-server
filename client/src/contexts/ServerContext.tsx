import React, { FC, useContext, useEffect, useState } from "react";

export type Connection = {
    pin: string;
    port: number;
    thirdIPValue: number;
    fourthIPValue: number;
    url: string;
};

export const PIN_LENGTH = 10;

export type ContextValue = { connection: Connection | null; connect: (pin: string) => void };

const ServerContext = React.createContext<ContextValue>({ connection: null, connect: () => {} });
const { Provider, Consumer } = ServerContext;

const ServerProvider: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<Connection | null>(null);

    async function connect(pin: string) {
        console.log(
            `Trying to connect with server... (PIN: %c${pin}%c)`,
            "color: lightblue",
            "color: unset"
        );

        if (pin.length !== PIN_LENGTH) {
            throw new Error(`The length of the PIN of the server must be composed ${PIN_LENGTH} characters.`);
        }
        if (!/^[0-9]+$/.test(pin)) {
            throw new Error("The PIN of the server should only be composed of digits.");
        }

        const port = parseInt(pin.substring(0, 4));
        const thirdIPValue = parseInt(pin.substring(4, 7));
        const fourthIPValue = parseInt(pin.substring(7));

        const url = `http://192.168.${thirdIPValue}.${fourthIPValue}:${port}`;

        console.log(`Base URL: %c"${url}"`, "color: lightblue");

        try {
            const endpoint = `${url}/check-connection`;

            await fetch(endpoint).then(res => res);

            const newConnection = {
                pin,
                port,
                thirdIPValue,
                fourthIPValue,
                url,
            };

            setConnection(newConnection);

            return newConnection;
        } catch (err) {
            console.log(err);

            return null;
        }
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
