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

const WATCHING_ROOM_NAME = "players#watching";

function watch(watching: boolean, socket: OurSocket) {
    socket[watching ? "join" : "leave"](WATCHING_ROOM_NAME);
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

    console.log("'player:join' was called!");

    const socketUsed = players().some(player => player.socketId === socket.id);
    console.log(`Socket in use: ${socketUsed}`);
    if (socketUsed) return emitError("Ce socket contrôle déjà un joueur.", socket);

    const [valid, message] = validateUsername(username);
    console.log(`Validation: ${valid || message}`)
    if (!valid) return emitError(message, socket);

    console.log("all checks passed!")

    const player: Player = {
        id: uuidv4(),
        socketId: socket.id,
        privateKey: uuidv4(), // only place where the private key is generated & sent to the client

        username,
        status: "idling",
    };

    setPlayers(old => old.concat([player]));
    console.log("emitting update...")
    emitUpdate(socket);
}

function edit(username: string, socket: OurSocket) {
    const [valid, message] = validateUsername(username);
    if (!valid) return emitError(message, socket);

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
    emitUpdate(socket);
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
    emitUpdate(socket);
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
    emitUpdate(socket);
}

function quit(socket: OurSocket) {
    setPlayers(oldPlayers =>
        oldPlayers.filter(player => {
            const socketMatch = player.socketId === socket.id;

            return !socketMatch;
        })
    );
    emitUpdate(socket);
}

function ready(ready: boolean, socket: OurSocket) {

    console.log(`call to set player ready (socket.id: ${socket.id})`)

    let errorMsg: string | null = null

    setPlayers(old =>
        old.map(player => {
            if (player.socketId !== socket.id) return player;

            if(player.status === "playing") {
                errorMsg = "Ce joueur est entrain de jouer, impossible de le déclarer prêt.";
                return player;
            }

            const newState = ready ? "ready" : "idling";
            if(player.status === newState) {
                errorMsg = "L'état donné correspond exactement à l'état actuel, impossible de le changer."
                return player;
            }

            return {
                ...player,
                status: newState,
            };
        })
    );

    if(errorMsg !== null) {
        emitError(errorMsg, socket);
        return;
    }

    emitUpdate(socket);
}

// removes the private key from the player so it can safely be sent to any client
function secure(player: Player) {
    return { ...player, privateKey: undefined };
}

function emitUpdate(socket: OurSocket) {
    socket.emit("player:update", players().find(player => player.socketId === socket.id) ?? null);
}

function emitError(message: string, socket: OurSocket) {
    console.log(`Emitting error (socketId = ${socket.id}) (message = '${message}')`);
    socket.emit("player:error", message);
}

export function registerPlayerOrder(io: OurServer, socket: OurSocket) {
    socket.on("player:watch", watching => watch(watching, socket));

    socket.on("player:join", username => join(username, socket));
    socket.on("player:edit", username => edit(username, socket));
    socket.on("player:link", key => link(key, socket));
    socket.on("player:quit", () => quit(socket));

    socket.on("player:ready", (newState) => ready(!newState ? true : false, socket));

    socket.on("disconnect", () => unlink(socket));

    addPlayersListener(players => {
        // may not to emit anything if the socket is not in the room "watching"
        io.to(WATCHING_ROOM_NAME).to(socket.id).emit("player:count", players.length);
    })
}

export const playersRouter = express.Router().get("/get-all", getAll).get("/get-from-id/:id", getFromID);

export { players as getPlayers, addPlayersListener, rmPlayersListener };
