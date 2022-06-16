import { Server, Socket } from "socket.io";
import { Socket as ClientSocket } from "socket.io-client";

import * as players from "./players";

export type CTSEvents = players.ClientToServerEvents;
export type STCEvents = players.ServerToClientEvents;
export type ISEvents = {};
export type SocketData = {};

export type OurServer = Server<CTSEvents, STCEvents, ISEvents, SocketData>;
export type OurSocket = Socket<CTSEvents, STCEvents, ISEvents, SocketData>;
export type OurClientSocket = ClientSocket<STCEvents, CTSEvents>;
