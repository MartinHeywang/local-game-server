import express from "express";
import { createServer } from "http";
import cors from "cors";
import ip from "ip";

import { Server, Socket } from "socket.io";

import { PlayerCTSE, playersRouter, PlayerSTCE, registerPlayerOrder } from "./players";

// express for the API
const EXPRESS_PORT = 8080;

// socket.io for the usage of the game
const SOCKET_IO_PORT = 5000;

const HOSTNAME = ip.address();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/players", playersRouter);

const httpServer = createServer(app);

// client to server events
type CTSEvents = PlayerCTSE;
// server to client events
type STCEvents = PlayerSTCE;

export type OurServer = Server<CTSEvents, STCEvents, {}, {}>;
export type OurSocket = Socket<CTSEvents, STCEvents, {}, {}>;

const io: OurServer = new Server(httpServer, { cors: {} });

io.on("connection", socket => {
    console.log(`connect ${socket.id}`);
    registerPlayerOrder(io, socket);

    socket.on("disconnect", reason => {
        console.log(`disconnect ${socket.id} due to ${reason}`);
    });
});

app.get("/", (_, res) => res.sendStatus(200));
app.get("/get-socket-info", (_, res) => {
    res.status(200).json(httpServer.address());
});

app.listen(EXPRESS_PORT, HOSTNAME, () => {
    console.log("- Express server set up!");

    httpServer.listen(SOCKET_IO_PORT, HOSTNAME, () => {
        console.log(`- Socket.io server set up!`);

        console.log(`http://${HOSTNAME}:${EXPRESS_PORT}`);
        console.log(`${new Date().toString()}`);
    });
});
