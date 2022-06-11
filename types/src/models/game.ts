export const MAX_PLAYERS_PER_GAME = 2;

export interface Game {
    id: string;
    playersId: string[];
    status: "preparing" | "started" | "ended";
}

export function full(game: Game) {
    return game.playersId.length >= MAX_PLAYERS_PER_GAME;
}
