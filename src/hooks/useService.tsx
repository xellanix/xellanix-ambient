import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { Track } from "../types";

interface ServiceProviderProps {
    lyricsRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}

const QueueContext = createContext<Track[]>([]);
const CurrentTrackIndexContext = createContext<number>(-1);
const CurrentLyricIndexContext = createContext<number>(-1);
const CurrentTimeContext = createContext<number>(0);

const QueueDispatcherContext = createContext<React.Dispatch<React.SetStateAction<Track[]>>>(
    () => {}
);
const CurrentTrackIndexDispatcherContext = createContext<
    React.Dispatch<React.SetStateAction<number>>
>(() => {});
const CurrentLyricIndexDispatcherContext = createContext<
    React.Dispatch<React.SetStateAction<number>>
>(() => {});
const CurrentTimeDispatcherContext = createContext<React.Dispatch<React.SetStateAction<number>>>(
    () => {}
);

const ServiceProvider: React.FC<ServiceProviderProps> = ({ lyricsRef, children }) => {
    const [queue, setQueue] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
    const [currentTime, setCurrentTime] = useState<number>(0);

    useEffect(() => {
        if (currentTrackIndex < 0 || currentTrackIndex >= queue.length) {
            setCurrentLyricIndex(-1);
            if (lyricsRef.current) lyricsRef.current.scrollTop = 0;
            return;
        }

        const track = queue[currentTrackIndex];
        if (!track?.lyrics?.length) {
            setCurrentLyricIndex(-1);
            if (lyricsRef.current) lyricsRef.current.scrollTop = 0;
            return;
        }

        const index = track.lyrics.findIndex((lyric, i) => {
            const nextTime = track.lyrics[i + 1]?.time || Infinity;
            return currentTime >= lyric.time && currentTime < nextTime;
        });

        if (index !== currentLyricIndex) {
            setCurrentLyricIndex(index);
        }
    }, [currentTime, currentTrackIndex, queue, currentLyricIndex]);

    return (
        <QueueDispatcherContext.Provider value={setQueue}>
            <CurrentTrackIndexDispatcherContext.Provider value={setCurrentTrackIndex}>
                <CurrentLyricIndexDispatcherContext.Provider value={setCurrentLyricIndex}>
                    <CurrentTimeDispatcherContext.Provider value={setCurrentTime}>
                        <QueueContext.Provider value={queue}>
                            <CurrentTrackIndexContext.Provider value={currentTrackIndex}>
                                <CurrentLyricIndexContext.Provider value={currentLyricIndex}>
                                    <CurrentTimeContext.Provider value={currentTime}>
                                        {children}
                                    </CurrentTimeContext.Provider>
                                </CurrentLyricIndexContext.Provider>
                            </CurrentTrackIndexContext.Provider>
                        </QueueContext.Provider>
                    </CurrentTimeDispatcherContext.Provider>
                </CurrentLyricIndexDispatcherContext.Provider>
            </CurrentTrackIndexDispatcherContext.Provider>
        </QueueDispatcherContext.Provider>
    );
};

const useQueue = () => {
    const value = useContext(QueueContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};
const useCurrentTrackIndex = () => {
    const value = useContext(CurrentTrackIndexContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};
const useCurrentLyricIndex = () => {
    const value = useContext(CurrentLyricIndexContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};
const useCurrentTime = () => {
    const value = useContext(CurrentTimeContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};

const useQueueDispatcher = () => {
    const value = useContext(QueueDispatcherContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};
const useCurrentTrackIndexDispatcher = () => {
    const value = useContext(CurrentTrackIndexDispatcherContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};
const useCurrentLyricIndexDispatcher = () => {
    const value = useContext(CurrentLyricIndexDispatcherContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};
const useCurrentTimeDispatcher = () => {
    const value = useContext(CurrentTimeDispatcherContext);

    if (value == null) {
        throw new Error("service hook must be used within a ServiceProvider");
    }

    return value;
};

export {
    ServiceProvider,
    useQueue,
    useCurrentTrackIndex,
    useCurrentLyricIndex,
    useCurrentTime,
    useQueueDispatcher,
    useCurrentTrackIndexDispatcher,
    useCurrentLyricIndexDispatcher,
    useCurrentTimeDispatcher,
};
