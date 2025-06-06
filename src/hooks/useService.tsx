import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Track } from "../types";
import { useGlanceRef, useLyricsRef } from "./useSharedRef";
import { binarySearch, findLyricIndex, shuffleArray } from "../lib/utils";
import { getSetting } from "../lib/migration";

interface ServiceProviderProps {
    children: React.ReactNode;
}

interface PlaylistProviderProps {
    children: React.ReactNode;
}

type DispatchContext<T> = React.Dispatch<React.SetStateAction<T>>;

const QueueContext = createContext<Track[]>([]);
const CurrentTrackIndexContext = createContext<number>(-1);
const CurrentLyricIndexContext = createContext<number>(-1);
const CurrentTimeContext = createContext<number>(0);

const QueueDispatcherContext = createContext<DispatchContext<Track[]>>(() => {});
const CurrentTrackIndexDispatcherContext = createContext<DispatchContext<number>>(() => {});
const CurrentLyricIndexDispatcherContext = createContext<DispatchContext<number>>(() => {});
const CurrentTimeDispatcherContext = createContext<DispatchContext<number>>(() => {});

const PlaylistContext = createContext<Track[]>([]);
const ShuffleContext = createContext<boolean>(false);
const PlaylistDispatcherContext = createContext<DispatchContext<Track[]>>(() => {});
const ShuffleDispatcherContext = createContext<DispatchContext<boolean>>(() => {});
const HandlePlayContext = createContext<(newIndex: number) => Promise<void>>(async () => {});

const SelectedTrackContext = createContext<Track | null>(null);

const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
    const lyricsRef = useLyricsRef();
    const glanceRef = useGlanceRef();

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
            glanceRef.current?.classList.toggle("glance", true);
            return;
        }

        const index = findLyricIndex(track.lyrics, currentTime);

        const timeInt = Math.trunc(currentTime);
        const lyricInt = Math.trunc(track.lyrics[0]?.time - 3);
        if (timeInt === lyricInt || (currentLyricIndex >= 0 && index !== currentLyricIndex)) {
            glanceRef.current?.classList.toggle("glance", false);
            glanceRef.current?.classList.toggle("lyrics", true);
        } else if (currentLyricIndex < 0 && timeInt < lyricInt) {
            glanceRef.current?.classList.toggle("glance", true);
            glanceRef.current?.classList.toggle("lyrics", false);
            glanceRef.current?.classList.toggle("lyrics-bg", true);
        }

        if (index !== currentLyricIndex) {
            setCurrentLyricIndex(index);
        }
    }, [currentTime]);

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

const getIsShuffled = () => parseInt(getSetting("isShuffled") || "0") === 1;
const PlaylistProvider = React.memo(
    ({
        children,
        resetState,
        handlePlay,
    }: PlaylistProviderProps & {
        resetState: () => void;
        handlePlay: (newIndex: number) => Promise<void>;
    }) => {
        const [playlist, setPlaylist] = useState<Track[]>([]);
        const [shuffle, setShuffle] = useState<boolean>(getIsShuffled);
        const shuffleSignatureRef = useRef<string>("");

        const setQueue = useQueueDispatcher();
        const currentTrackIndex = useCurrentTrackIndex();
        const queue = useQueue();
        const setCurrentTrackIndex = useCurrentTrackIndexDispatcher();

        useEffect(() => {
            const newSignature = `${shuffle}:${playlist.map((track) => track.url).join(",")}`;

            if (newSignature === shuffleSignatureRef.current) {
                return;
            }

            shuffleSignatureRef.current = newSignature;

            if (shuffle) {
                const shuffled = shuffleArray(playlist);
                if (!Object.is(queue, shuffled)) {
                    setQueue(shuffled);

                    if (currentTrackIndex >= 0 && currentTrackIndex < queue.length) {
                        // Get from the previous version queue
                        const queueId = queue[currentTrackIndex].id;
                        const newIndex = shuffled.findIndex((t) => t.id === queueId);

                        if (newIndex !== -1) setCurrentTrackIndex(newIndex);
                        else resetState();
                    }
                }
            } else {
                if (!Object.is(playlist, queue)) {
                    if (playlist.length === 0) {
                        setQueue(playlist);
                        resetState();
                        return;
                    }
                    
                    const newIndex = binarySearch(playlist, queue[currentTrackIndex]?.id ?? -1);

                    setQueue(playlist);

                    if (newIndex !== -1) setCurrentTrackIndex(newIndex);
                    else resetState();
                }
            }
        }, [playlist, shuffle]);

        return (
            <PlaylistDispatcherContext.Provider value={setPlaylist}>
                <ShuffleDispatcherContext.Provider value={setShuffle}>
                    <PlaylistContext.Provider value={playlist}>
                        <ShuffleContext.Provider value={shuffle}>
                            <HandlePlayContext value={handlePlay}>{children}</HandlePlayContext>
                        </ShuffleContext.Provider>
                    </PlaylistContext.Provider>
                </ShuffleDispatcherContext.Provider>
            </PlaylistDispatcherContext.Provider>
        );
    }
);

const SelectedTrackProvider = React.memo(({ children }: { children: React.ReactNode }) => {
    const current = useCurrentTrackIndex();
    const queue = useQueue();

    const selectedTrack = useMemo(() => {
        if (current >= 0 && current < queue.length) {
            return queue[current];
        }

        return null;
    }, [current, queue]);

    return (
        <SelectedTrackContext.Provider value={selectedTrack}>
            {children}
        </SelectedTrackContext.Provider>
    );
});

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

const usePlaylist = () => {
    const value = useContext(PlaylistContext);

    if (value == null) {
        throw new Error("playlist hook must be used within a PlaylistProvider");
    }

    return value;
};

const usePlaylistDispatcher = () => {
    const value = useContext(PlaylistDispatcherContext);

    if (value == null) {
        throw new Error("playlist hook must be used within a PlaylistProvider");
    }

    return value;
};

const useShuffle = () => {
    const value = useContext(ShuffleContext);

    if (value == null) {
        throw new Error("shuffle hook must be used within a PlaylistProvider");
    }

    return value;
};

const useShuffleDispatcher = () => {
    const value = useContext(ShuffleDispatcherContext);

    if (value == null) {
        throw new Error("shuffle hook must be used within a PlaylistProvider");
    }

    return value;
};
const useHandlePlay = () => {
    const value = useContext(HandlePlayContext);

    if (value == null) {
        throw new Error("handle play hook must be used within a PlaylistProvider");
    }

    return value;
};

const useSelectedTrack = () => {
    const value = useContext(SelectedTrackContext);

    return value;
};

export {
    ServiceProvider,
    PlaylistProvider,
    SelectedTrackProvider,
    useQueue,
    useCurrentTrackIndex,
    useCurrentLyricIndex,
    useCurrentTime,
    useQueueDispatcher,
    useCurrentTrackIndexDispatcher,
    useCurrentLyricIndexDispatcher,
    useCurrentTimeDispatcher,
    usePlaylist,
    usePlaylistDispatcher,
    useShuffle,
    useShuffleDispatcher,
    useHandlePlay,
    useSelectedTrack,
};
