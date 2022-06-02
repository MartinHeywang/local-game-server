import express from "express";
import cors from "cors";
import ip from "ip";
import { v4 as uuidv4 } from "uuid";

import { initListenableValue } from "./listener";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const HOSTNAME = ip.address();

interface Player {
    id: string;
    ip: string;
    username: string;
    connectionTime: Date;
}

const [players, setPlayers, addPlayersListener, rmPlayersListener] = initListenableValue<Player[]>([]);

// a route to make sure the client is available
app.get("/check-connection", (_, res) => res.sendStatus(200));

app.get("/watch-players", (_, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const listener = (newValue: Player[]) => {
        res.write(JSON.stringify(newValue));
    };

    addPlayersListener(listener);
    listener(players());

    res.on("close", () => {
        rmPlayersListener(listener);
        res.end();
    });
});

app.post("/register-player", (req, res) => {
    const { username } = req.body;

    console.log("---------------------------------------------------");
    console.log("Registering player:");
    console.log("old player list");
    console.log(players());

    if (players().some(player => player.ip === req.ip)) {
        res.status(400).send({ message: "Un autre joueur avec la même adresse IP existe déjà!" });
        return;
    }
    if (players().some(player => player.username === username)) {
        res.status(400).send({ message: "Ce nom d'utilisateur est déjà pris!" });
        return;
    }

    const player: Player = {
        username,
        connectionTime: new Date(),
        id: uuidv4(),
        ip: req.ip,
    };

    setPlayers(old => old.concat([player]));

    res.status(200).json(player);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`http://${HOSTNAME}:${PORT}/`);
});
