import express from "express";
import http from "http";
import cors from "cors";
import ip from "ip";
import { Server, Socket } from "socket.io";

import { playersRouter } from "./players";

const PORT = 5000;
const HOSTNAME = ip.address();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/players", playersRouter);

const httpServer = http.createServer(app);
const io = new Server(httpServer);
io.on("connection", (socket: Socket) => {
    console.log(JSON.stringify(socket, null, 4));
});


app.get("/", (_, res) => res.sendStatus(200));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`http://${HOSTNAME}:${PORT}/`);
});
