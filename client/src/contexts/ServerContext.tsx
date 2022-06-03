import React, { FC, useContext, useEffect, useState } from "react";

export type Connection = {
    pin: string;
    ip: [number, number, number, number, number];
    url: string;
    connectionTime: Date;
};

export type ContextValue = { connection: Connection | null; connect: (pin: string) => Promise<Connection | null> };

const ServerContext = React.createContext<ContextValue>({ connection: null, connect: async () => null });
const { Provider, Consumer } = ServerContext;

const ServerProvider: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [connection, setConnection] = useState<Connection | null>(null);

    async function connect(pin: string) {
        console.log(
            `Tentative de connexion au serveur %c${pin}`,
            "color: lightblue"
        );

        // remove the # at the beginning and split between the dots
        try {
            const ipString = pin.substring(1);
            const ip = ipString.split(".").map(part => parseInt(part));

            // 5 = IPv4 normal length + port value
            if (ip.length !== 5) throw new Error(`PIN invalide`);

            const url = `http://${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}:${ip[4]}`;

            console.log(`URL du serveur: %c"${url}"`, "color: lightblue");

            const ok = await fetch(url).then(res => res.ok);
            if(!ok) throw new Error("Serveur indisponible.")

            const newConnection: Connection = {
                pin,
                ip: ip as Connection["ip"],
                url,
                connectionTime: new Date(),
            };

            setConnection(newConnection);

            return newConnection;
        } catch (err: any) {
            console.log(`Caught error while trying to connect to server %c${pin}`, "color: lightblue");
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
