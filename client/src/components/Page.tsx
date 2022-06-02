import React, { FC } from "react";

import "../scss/Page.scss";

interface Props {
    children?: React.ReactNode;
}

const Page: FC<Props> = ({ children }) => {
    return <div className="Page">
        <div className="Page__container">{children}</div>
    </div>;
};

export default Page;
