import React from "react";

export interface Player {
    id: string;
    ip: string;
    username: string;
    connectionTime: Date;
}

const PlayerContext = React.createContext({});
