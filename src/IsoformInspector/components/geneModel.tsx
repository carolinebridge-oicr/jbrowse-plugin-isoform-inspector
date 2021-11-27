import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../model";

export const GeneModel = () => {
    const store = useStore();

    return (
        <div>
            GeneModel
        </div>
    );
};

export default observer(GeneModel)
