import React, { createContext, useContext } from "react";

interface TrackContextProps {
    current: number;
    dispatch: React.Dispatch<React.SetStateAction<number>>;
}

interface TrackProviderProps {
    value: { current: number; dispatch: React.Dispatch<React.SetStateAction<number>> };
    children: React.ReactNode;
}

const TrackContext = createContext<TrackContextProps>({current: -1, dispatch: () => {}});

const TrackProvider: React.FC<TrackProviderProps> = ({ value, children }) => {
    return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
};

const useCurrentTrack = () => {
    const context = useContext(TrackContext);

    if (!context) {
        throw new Error("useCurrentTrack must be used within a TrackProvider");
    }

    return context;
}

export { TrackProvider, useCurrentTrack };