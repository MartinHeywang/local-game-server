import React, { FC } from "react";

import "../scss/Player.scss";

interface Props {
    player:
        | {
              id: string;
              username: string;
          }
        | undefined;
}

const Player: FC<Props> = ({ player }) => {
    return (
        <div className="Player">
            <img className="Player__avatar" src={`https://avatars.dicebear.com/api/bottts/${player?.id}.svg`} />
            <p className="Player__username">{player?.username}</p>
        </div>
    );
};

export default Player;
