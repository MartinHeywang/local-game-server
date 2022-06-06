import express, { Request, Response } from "express";
import { initListenableValue } from "./listener";
import { v4 as uuidv4 } from "uuid";

interface Player {
    id: string;
    ip: string;
    username: string;
    connectionTime: Date;
    privateKey: string | undefined;
}

const [players, setPlayers, addPlayersListener, rmPlayersListener] = initListenableValue<Player[]>([]);

function watch(_: Request, res: Response) {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const listener = (newValue: Player[]) => {
        res.write(JSON.stringify(newValue.map(player => secure(player))));
    };

    addPlayersListener(listener);
    listener(players());

    res.on("close", () => {
        rmPlayersListener(listener);
        res.end();
    });
}

function getAll(_: Request, res: Response) {
    res.status(200).json(players().map(player => secure(player)));
}

function getFromID(req: Request, res: Response) {
    const { id } = req.params;

    const player = players().find(player => player.id === id);
    if (!player) {
        res.status(400).json({ message: "Aucun joueur ne porte cet ID." });
        return;
    }

    res.status(200).json(secure(player));
}

function getFromIP(req: Request, res: Response) {
    const ip = decodeURIComponent(req.params.ip);

    const player = players().find(player => player.ip === ip);
    if (!player) {
        res.status(400).json({ message: "Aucun joueur ne porte cette adresse IP." });
        return;
    }

    res.status(200).json(secure(player));
}

function join(req: Request, res: Response) {
    const { username } = req.body;

    if (players().some(player => player.ip === req.ip)) {
        res.status(400).send({ message: "Un autre joueur avec la même adresse IP existe déjà!" });
        return;
    }
    if (players().some(player => player.username === username)) {
        res.status(400).send({ message: "Ce pseudo existe déjà!" });
        return;
    }
    const tooShort = username.length < 3;
    const tooLong = username.length >= 15;
    if (tooShort || tooLong) {
        res.status(400).send({
            message: `Ce pseudo est trop ${
                tooShort ? "court (3 caractères min)" : "long (15 caractères max)"
            }!`,
        });
        return;
    }

    const player: Player = {
        username,
        connectionTime: new Date(),
        id: uuidv4(),
        ip: req.ip,
        // only place where the private key is generated & sent to the client
        privateKey: uuidv4(),
    };

    setPlayers(old => old.concat([player]));

    res.status(200).json(player);
}

function edit(req: Request, res: Response) {
    const { privateKey, username } = req.body;

    if (!privateKey || !username) return res.sendStatus(422);

    // using map() here to only change one element in the array
    setPlayers(oldPlayers =>
        oldPlayers.map(player => {
            // only change the player with the given id
            if (player.privateKey !== privateKey) return player;

            return {
                ...player,
                username,
            };
        })
    );

    res.sendStatus(200);
}

function quit(req: Request, res: Response) {
    const { privateKey } = req.body;

    if(!privateKey) return res.sendStatus(422);

    setPlayers(oldPlayers => oldPlayers.filter(player => player.privateKey !== privateKey));

    res.sendStatus(200);
}

// removes the private key from the player so it can safely be sent to any client
function secure(player: Player) {
    return { ...player, privateKey: undefined };
}

export const playersRouter = express
    .Router()
    .get("/watch", watch)
    .get("/get-all", getAll)
    .get("/get-from-id/:id", getFromID)
    .get("/get-from-ip/:ip", getFromIP)
    .post("/join", join)
    .post("/edit", edit)
    .delete("/quit", quit);

export { players as getPlayers, addPlayersListener, rmPlayersListener };
