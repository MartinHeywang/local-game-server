import React, { FC } from "react";

import "../scss/Page.scss";

interface Props {
    children?: React.ReactNode;
    className?: string;
}

const Page: FC<Props> = ({ children, className = "" }) => {
    return <div className={`Page ${className}`.trim()}>
        <div className="Page__container">{children}</div>
    </div>;
};

export default Page;
