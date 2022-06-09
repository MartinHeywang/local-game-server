import express from "express";
import { createServer } from "http";
import cors from "cors";
import ip from "ip";

import { Server } from "socket.io";

import { playersRouter } from "./players";

const PORT = 5000;
const HOSTNAME = ip.address();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/players", playersRouter);

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {}
});

io.on("connection", socket => {
    console.log("Socket connected:")
    console.log(socket.id);
});
io.on("disconnect", socket => {
    console.log("Socket disconnected:")
    console.log(socket.id);
});

app.get("/", (_, res) => res.sendStatus(200));
app.get("/get-socket-info", (_, res) => {
    res.status(200).json(httpServer.address());
});

app.listen(PORT, HOSTNAME, () => {
    console.log("- Express server set up!");

    httpServer.listen(PORT+1, HOSTNAME, () => {
        console.log(`- Socket.io server set up!`);
        console.log(`http://${HOSTNAME}:${PORT}`);
        console.log(`${new Date().toString()}`);
    });
})


