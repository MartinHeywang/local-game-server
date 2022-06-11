import { Server, Socket } from "socket.io";
import * as players from "./players";
export * from "./players";

type CTSEvents = players.ClientToServerEvents;
type STCEvents = players.ServerToClientEvents;
type ISEvents = {};
type SocketData = {};

export type OurServer = Server<CTSEvents, STCEvents, ISEvents, SocketData>;
export type OurSocket = Socket<CTSEvents, STCEvents, ISEvents, SocketData>;
