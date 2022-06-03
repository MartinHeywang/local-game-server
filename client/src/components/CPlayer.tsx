import React, { FC } from "react";

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
    return (
        <div className="CPlayer">
            <img className="CPlayer__avatar" src={`https://avatars.dicebear.com/api/bottts/${player?.id}.svg`} />
            <p className="CPlayer__username">{player?.username}</p>
        </div>
    );
};

export default CPlayer;
