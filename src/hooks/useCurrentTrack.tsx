import React, { createContext, useContext } from "react";

interface TrackProviderProps {
    value: number;
    dispatcher: React.Dispatch<React.SetStateAction<number>>;
    children: React.ReactNode;
}

type TrackContextType = [number, React.Dispatch<React.SetStateAction<number>>];

const TrackContext = createContext<TrackContextType>([
    -1,
    () => {},
]);

const TrackProvider: React.FC<TrackProviderProps> = ({ value, dispatcher, children }) => {
    const memo = React.useMemo<TrackContextType>(() => [value, dispatcher], [value, dispatcher]);
    return <TrackContext.Provider value={memo}>{children}</TrackContext.Provider>;
};

const useCurrentTrack = () => {
    const context = useContext(TrackContext);

    if (!context) {
        throw new Error("useCurrentTrack must be used within a TrackProvider");
    }

    return context;
};

export { TrackProvider, useCurrentTrack };
