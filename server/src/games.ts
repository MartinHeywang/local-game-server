import { initListenableValue } from "./listener";
import { v4 as uuidv4 } from "uuid";
import { models } from "local-game-server-types";

type Player = models.Player;
type Game = models.Game;

const [games, setGames] = initListenableValue<Game[]>([]);

function createGame() {
    const newGame: Game = {
        id: uuidv4(),
        playersId: [],
        status: "preparing",
    };

    setGames(old => old.concat([newGame]));

    return newGame;
}

export function assignPlayerToGame(player: Player) {
    const game = (() => {
        const allGamesFull = games().every(game => models.gameUtil.full(game));
        if (allGamesFull) return createGame();
        return games().find(game => !models.gameUtil.full(game))!;
    })();

    game.playersId.push(player.id);

    // info start game if full
}

function startGame(game: Game) {
    if (!models.gameUtil.full(game)) return;

    game.status = "started";
}
