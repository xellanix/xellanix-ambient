import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    AudioPlayerControllerMemo,
    AudioPlayerIslandMemo,
    AudioPlayerTimelineMemo,
    AudioPlayerTrackMemo,
    AudioPlayerVolumeMemo,
} from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import { Track } from "./types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowShrink02Icon,
    FullScreenIcon,
    Moon02Icon,
    Sun03Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { SidebarMemo } from "./components/Sidebar";
import { Button } from "./components/Button/Button";
import {
    ServiceProvider,
    useCurrentLyricIndexDispatcher,
    useCurrentTimeDispatcher,
    useCurrentTrackIndex,
    useCurrentTrackIndexDispatcher,
    useQueue,
    useQueueDispatcher,
} from "./hooks/useService";
import AudioPlayerMemo from "./components/AudioPlayer";
import { binarySearch, shuffleArray } from "./lib/utils";

const getIsShuffled = () => parseInt(window.localStorage.getItem("isShuffled") || "0") === 1;
const getLoopMode = () =>
    (window.localStorage.getItem("loopMode") as "none" | "track" | "playlist") || "none";

const HeaderMemo = React.memo(() => {
    const [darkMode, setDarkMode] = useState<boolean>(false);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => {
            const newMode = !prev;
            document.documentElement.classList.toggle("dark", newMode);
            return newMode;
        });
    }, []);

    return (
        <>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-normal)]">
                    Xellanix Ambient
                </h1>
                <div className="flex space-x-2 sm:space-x-3">
                    <button
                        onClick={toggleDarkMode}
                        className="p-3 rounded-full bg-[var(--bg-secondary)] text-gray-800 dark:text-gray-200 hover:bg-[var(--bg-tertiary)] transition-colors"
                        title={darkMode ? "Light Mode" : "Dark Mode"}>
                        <HugeiconsIcon
                            icon={Moon02Icon}
                            altIcon={Sun03Icon}
                            showAlt={darkMode}
                            className="size-5"
                        />
                    </button>
                </div>
            </div>
        </>
    );
});

const MaximizeLyricsButton = React.memo(
    ({ isMaximized, onClick }: { isMaximized: boolean; onClick: () => void }) => (
        <div className="absolute z-50 right-0">
            <Button
                styleType="secondary"
                className="w-10 h-9.5 [--button-p:theme(padding.2)] opacity-0 group-hover:animate-[show-maximize_4s] hover:!opacity-100 focus-visible:!opacity-100"
                onClick={onClick}
                title={isMaximized ? "Restore Lyrics" : "Maximize Lyrics"}>
                <HugeiconsIcon
                    icon={FullScreenIcon}
                    altIcon={ArrowShrink02Icon}
                    showAlt={isMaximized}
                    className="size-6"
                    strokeWidth={0}
                    opacity={0.5}
                />
            </Button>
        </div>
    )
);

const AppService: React.FC<{
    lyricsRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}> = ({ lyricsRef }) => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const queue = useQueue();
    const setQueue = useQueueDispatcher();
    const currentTrackIndex = useCurrentTrackIndex();
    const setCurrentTrackIndex = useCurrentTrackIndexDispatcher();
    const setCurrentTime = useCurrentTimeDispatcher();
    const setCurrentLyricIndex = useCurrentLyricIndexDispatcher();
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const [shuffle, setShuffle] = useState<boolean>(getIsShuffled);
    const [loop, setLoop] = useState<"none" | "track" | "playlist">(getLoopMode);
    const [maximizeLyrics, setMaximizeLyrics] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const shuffleSignatureRef = useRef<string>("");

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
                const newIndex = binarySearch(playlist, queue[currentTrackIndex]?.id ?? -1);
                
                setQueue(playlist);

                if (newIndex !== -1) setCurrentTrackIndex(newIndex);
                else resetState();
            }
        }
    }, [playlist, shuffle]);

    const toggleLyrics = useCallback(() => setShowLyrics((prev) => !prev), []);
    const toggleShuffle = useCallback(
        () =>
            setShuffle((prev) => {
                const newVal = !prev;
                window.localStorage.setItem("isShuffled", newVal ? "1" : "0");
                return newVal;
            }),
        []
    );

    const toggleLoop = useCallback(() => {
        setLoop((prev) => {
            let newType: "none" | "track" | "playlist" = "none";
            if (prev === "none") newType = "track";
            else if (prev === "track") newType = "playlist";

            window.localStorage.setItem("loopMode", newType);
            return newType;
        });
    }, []);

    const playTrack = useCallback(
        async (track: Track, index: number) => {
            if (index < 0 || index >= queue.length || !audioRef.current) {
                setIsPlaying(false);
                setCurrentTrackIndex(-1);
                setCurrentTime(0);
                setCurrentLyricIndex(-1);
                return;
            }

            setCurrentTrackIndex(index);
            setCurrentTime(0);
            setCurrentLyricIndex(-1);
            if (lyricsRef.current) lyricsRef.current.scrollTop = 0;

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current.currentTime = 0;
                audioRef.current.src = track.url;
                try {
                    await audioRef.current.load();
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err) {
                    console.error("Playback error:", err);
                    setIsPlaying(false);
                }
            }
        },
        [queue]
    );

    const resetState = useCallback(() => {
        setIsPlaying(false);
        setCurrentTrackIndex(-1);
        setCurrentTime(0);
        setCurrentLyricIndex(-1);
        if (audioRef.current) {
            audioRef.current.src = "";
        }
    }, []);

    const currentLyrics = useMemo(
        () =>
            currentTrackIndex >= 0 && currentTrackIndex < queue.length
                ? queue[currentTrackIndex]?.lyrics || []
                : [],
        [currentTrackIndex, queue]
    );

    const handlePlay = useCallback(
        async (newIndex: number) => await playTrack(queue[newIndex], newIndex),
        [queue, playTrack]
    );

    const playNext = useCallback(async () => {
        if (currentTrackIndex + 1 < queue.length) await handlePlay(currentTrackIndex + 1);
        else if (loop === "playlist" && queue.length > 0) await handlePlay(0);
        else resetState();
    }, [currentTrackIndex, loop, queue, handlePlay, resetState]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    }, [audioRef, setCurrentTime, setDuration]);

    const handleEnded = useCallback(async () => {
        if (loop === "track" && currentTrackIndex >= 0) await handlePlay(currentTrackIndex);
        else await playNext();
    }, [currentTrackIndex, loop, handlePlay]);

    const loadedMetadata = useCallback(
        () => setDuration(audioRef.current?.duration || 0),
        [audioRef, setDuration]
    );

    const toggleMaximizeLyrics = useCallback(() => setMaximizeLyrics((prev) => !prev), []);

    return (
        <div className="container mx-auto p-2 sm:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen h-screen max-h-screen flex flex-col gap-2 sm:gap-4 overflow-auto">
            {!maximizeLyrics && <HeaderMemo />}

            <div className="flex flex-col sm:flex-row gap-4 sm:flex-1 sm:overflow-hidden max-h-full sm:pb-8">
                {/* Lyrics (Main Content) */}
                <div className="flex flex-col flex-1 relative group overflow-auto sm:h-full max-h-full">
                    {showLyrics && (
                        <>
                            <MaximizeLyricsButton
                                isMaximized={maximizeLyrics}
                                onClick={toggleMaximizeLyrics}
                            />
                            <LyricsDisplay
                                lyrics={currentLyrics}
                                lyricsRef={lyricsRef}
                                audioRef={audioRef}
                            />
                        </>
                    )}
                </div>

                {!maximizeLyrics && (
                    <SidebarMemo
                        playlist={playlist}
                        setPlaylist={setPlaylist}
                        playTrack={playTrack}
                        showLyrics={showLyrics}
                        toggleLyrics={toggleLyrics}
                    />
                )}
            </div>

            {/* Audio Player */}
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-40 max-w-[90%] sm:max-w-[400px]">
                <AudioPlayerMemo
                    audioRef={audioRef}
                    loadedMetadata={loadedMetadata}
                    handleTimeUpdate={handleTimeUpdate}
                    handleEnded={handleEnded}
                    islandComp={<AudioPlayerIslandMemo duration={duration} />}
                    trackComp={<AudioPlayerTrackMemo />}
                    controllerComp={
                        <AudioPlayerControllerMemo
                            audioRef={audioRef}
                            isPlaying={isPlaying}
                            setIsPlaying={setIsPlaying}
                            shuffle={shuffle}
                            loop={loop}
                            toggleShuffle={toggleShuffle}
                            toggleLoop={toggleLoop}
                            handlePlay={handlePlay}
                            playNext={playNext}
                        />
                    }
                    timelineComp={
                        <AudioPlayerTimelineMemo audioRef={audioRef} duration={duration} />
                    }
                    volumeComp={<AudioPlayerVolumeMemo audioRef={audioRef} />}
                />
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const lyricsRef = useRef<HTMLDivElement | null>(null);
    return (
        <ServiceProvider lyricsRef={lyricsRef}>
            <AppService lyricsRef={lyricsRef}>l</AppService>
        </ServiceProvider>
    );
};

export default App;
