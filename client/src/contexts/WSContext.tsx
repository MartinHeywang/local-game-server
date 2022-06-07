import React, { FC, useState } from "react";

import { io, Socket } from "socket.io-client";

interface ContextValue {
    socket: Socket | null | undefined;
}

const WSContext = React.createContext<ContextValue>({ socket: undefined });
const { Provider, Consumer } = WSContext;

const WSProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null | undefined>();

    return <Provider value={{ socket }}>{children}</Provider>;
};

export { WSContext, WSProvider, Consumer as WSConsumer };
