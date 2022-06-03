import express, { Request, Response } from "express";
import { initListenableValue } from "./listener";
import { v4 as uuidv4 } from "uuid";

interface Player {
    id: string;
    ip: string;
    username: string;
    connectionTime: Date;
}

const [players, setPlayers, addPlayersListener, rmPlayersListener] = initListenableValue<Player[]>([]);

function watch(_: Request, res: Response) {
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
}

function getAll(_: Request, res: Response) {
    res.status(200).json(players());
}

function getFromID(req: Request, res: Response) {
    const { id } = req.params;

    const player = players().find(player => player.id === id);
    if (!player) {
        res.status(400).json({ message: "Aucun joueur ne porte cet ID." });
        return;
    }

    res.status(200).json(player);
}

function getFromIP(req: Request, res: Response) {
    const ip = decodeURIComponent(req.params.ip);

    const player = players().find(player => player.ip === ip);
    if (!player) {
        res.status(400).json({ message: "Aucun joueur ne porte cette adresse IP." });
        return;
    }

    res.status(200).json(player);
}

function add(req: Request, res: Response) {
    const { username } = req.body;

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
}

function edit(req: Request, res: Response) {
    const { id, username } = req.body;

    // using map() here to only change one element in the array
    setPlayers(oldPlayers =>
        oldPlayers.map(player => {
            // only change the player with the given id
            if (player.id !== id) return player;

            return {
                ...player,
                username,
            };
        })
    );

    res.sendStatus(200);
}

function _delete(req: Request, res: Response) {
    const { id } = req.body;

    setPlayers(oldPlayers => oldPlayers.filter(player => player.id !== id));

    res.sendStatus(200);
}

export const playersRouter = express
    .Router()
    .get("/watch", watch)
    .get("/get-all", getAll)
    .get("/get-from-id/:id", getFromID)
    .get("/get-from-ip/:ip", getFromIP)
    .post("/add", add)
    .post("/edit", edit)
    .delete("/delete", _delete);

export { players as getPlayers, addPlayersListener, rmPlayersListener };
