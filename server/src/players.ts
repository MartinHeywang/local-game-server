import express, { Request, Response } from "express";
import { initListenableValue } from "./listener";
import { v4 as uuidv4 } from "uuid";
import { socketIO, models } from "local-game-server-types";

type OurServer = socketIO.OurServer;
type OurSocket = socketIO.OurSocket;
type Player = models.Player;

const [players, setPlayers, addPlayersListener, rmPlayersListener] = initListenableValue<Player[]>([]);

function getAll(_: Request, res: Response) {
    res.status(200).json(players().map(player => secure(player)));
}

function getFromID(req: Request, res: Response) {
    const { id } = req.params;

    const player = players().find(player => player.id === id);
    if (!player) {
        res.status(404).json({ message: "Aucun joueur ne porte cet ID." });
        return;
    }

    res.status(200).json(secure(player));
}

function watch(watching: boolean, socket: OurSocket) {
    socket[watching ? "join" : "leave"]("players#watching");
    if (watching) socket.emit("player:count", players().length);
}

function validateUsername(username: string): [boolean, string] {
    const tooShort = username.length < 3;
    if (tooShort) return [false, "Ce pseudo est trop court!"];

    const tooLong = username.length >= 15;
    if (tooLong) return [false, "Ce pseudo est trop long!"];

    const alreadyInUse = players().some(player => player.username === username);
    if (alreadyInUse) return [false, "Ce pseudo existe déjà!"];

    return [true, "OK!"];
}

function join(username: string, socket: OurSocket) {
    const socketUsed = players().some(player => player.socketId === socket.id);
    if (socketUsed) throw new Error("Ce socket contrôle déjà un joueur.");

    const [valid, message] = validateUsername(username);
    if (!valid) throw new Error(message);

    const player: Player = {
        id: uuidv4(),
        socketId: socket.id,
        privateKey: uuidv4(), // only place where the private key is generated & sent to the client

        username,
        status: "idling",
    };

    setPlayers(old => old.concat([player]));
}

function edit(username: string, socket: OurSocket) {
    const [valid, message] = validateUsername(username);
    if (!valid) throw new Error(message);

    // using map() here to only change one element in the array
    setPlayers(oldPlayers =>
        oldPlayers.map(player => {
            // only change the player with the given id
            if (player.socketId !== socket.id) return player;

            return {
                ...player,
                username,
            };
        })
    );
}

function link(privateKey: string, socket: OurSocket) {
    setPlayers(old =>
        old.map(player => {
            if (player.privateKey !== privateKey) return player;

            // this line is to detect if the private key has been comprised...
            // const compromised = player.socketId !== null && player.socketId !== socket.id;

            return {
                ...player,
                socketId: socket.id,
            };
        })
    );
}

function unlink(socket: OurSocket) {
    setPlayers(old =>
        old.map(player => {
            if (player.socketId !== socket.id) return player;

            return {
                ...player,
                socketId: null,
            };
        })
    );
}

function quit(socket: OurSocket) {
    setPlayers(oldPlayers =>
        oldPlayers.filter(player => {
            const socketMatch = player.socketId === socket.id;

            return !socketMatch;
        })
    );
}

function changePlayerStatus(newStatus: Player["status"], socket: OurSocket) {
    setPlayers(old =>
        old.map(player => {
            if (player.socketId !== socket.id) return player;

            return {
                ...player,
                status: newStatus,
            };
        })
    );
}

function ready(socket: OurSocket) {
    const player = players().find(player => player.socketId === socket.id)!;
    if (player.status !== "idling") return;

    changePlayerStatus("ready", socket);
}

// removes the private key from the player so it can safely be sent to any client
function secure(player: Player) {
    return { ...player, privateKey: undefined };
}

export function registerPlayerOrder(io: OurServer, socket: OurSocket) {
    socket.on("player:watch", watching => watch(watching, socket));

    socket.on("player:join", username => join(username, socket));
    socket.on("player:edit", username => edit(username, socket));
    socket.on("player:link", key => link(key, socket));
    socket.on("player:quit", () => quit(socket));

    socket.on("player:ready", () => ready(socket));

    socket.on("disconnect", () => unlink(socket));
}

export const playersRouter = express.Router().get("/get-all", getAll).get("/get-from-id/:id", getFromID);

export { players as getPlayers, addPlayersListener, rmPlayersListener };
