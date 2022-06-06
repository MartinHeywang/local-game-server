import React, { FC } from "react";
import { usePlayer } from "../contexts/PlayerContext";

import "../scss/CPlayer.scss";

interface Props {
    player:
        | {
              id: string;
              username: string;
          }
        | undefined;
}

const CPlayer: FC<Props> = ({ player }) => {

    const {player: currentPlayer} = usePlayer();

    return (
        <div className="CPlayer">
            <img className="CPlayer__avatar" src={`https://avatars.dicebear.com/api/bottts/${player?.id}.svg`} />
            <p className="CPlayer__username">{player?.username}{currentPlayer?.id === player?.id ? " (Toi)" : ""}</p>
        </div>
    );
};

export default CPlayer;
