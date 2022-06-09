import { initListenableValue } from "./listener";
import { Player, playersRouter } from "./players";

import { v4 as uuidv4 } from "uuid";

export interface Game {
    id: string;
    playersId: string[];
    status: "preparing" | "started" | "ended";
}

const MAX_PLAYERS_PER_GAME = 2;

const [games, setGames] = initListenableValue<Game[]>([]);

function createGame() {
    const newGame: Game = {
        id: uuidv4(),
        playersId: [],
        status: "preparing"
    };

    setGames(old => old.concat([newGame]));

    return newGame;
}

function full(game: Game) {
    return game.playersId.length >= MAX_PLAYERS_PER_GAME;
}

export function assignPlayerToGame(player: Player) {

    const game = (() => {
        const allGamesFull = games().every(game => full(game));
        if(allGamesFull) return createGame()
        return games().find(game => !full(game))!
    })();

    game.playersId.push(player.id);

    // info start game if full
}

function startGame(game: Game) {
    if(!full(game)) return;

    game.status = "started";
}