import React, { useState, useCallback } from "react";
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
import { ArrowShrink02Icon, FullScreenIcon } from "@hugeicons-pro/core-solid-rounded";
import { SidebarMemo } from "./components/Sidebar";
import { Button } from "./components/Button/Button";
import {
    PlaylistProvider,
    SelectedTrackProvider,
    ServiceProvider,
    useCurrentLyricIndexDispatcher,
    useCurrentTimeDispatcher,
    useCurrentTrackIndex,
    useCurrentTrackIndexDispatcher,
    useQueue,
} from "./hooks/useService";
import AudioPlayerMemo from "./components/AudioPlayer";
import { SharedRefProvider, useAudioRef, useGlanceRef, useLyricsRef } from "./hooks/useSharedRef";
import { TrackGlance } from "./components/TrackGlance";

const getLoopMode = () =>
    (window.localStorage.getItem("loopMode") as "none" | "track" | "playlist") || "none";

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

const AppContent = React.memo(({ playTrack }: { playTrack: any }) => {
    const [maximizeLyrics, setMaximizeLyrics] = useState<boolean>(false);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);

    const toggleMaximizeLyrics = useCallback(() => setMaximizeLyrics((prev) => !prev), []);
    const toggleLyrics = useCallback(() => setShowLyrics((prev) => !prev), []);

    return (
        <div className="flex flex-col sm:flex-row gap-4 sm:flex-1 sm:overflow-hidden max-h-full sm:pb-8">
            <div className="flex flex-col flex-1 relative group overflow-auto sm:h-full max-h-full">
                {showLyrics && (
                    <>
                        <div className="@container absolute size-full flex justify-center items-center">
                            <div className="flex items-center gap-2">
                                <img src="./icon-sq.svg" alt="Xellanix icon" className="@sm:size-12 size-10" />
                                <h1 className="text-2xl @sm:text-4xl font-bold text-[var(--text-normal)]">
                                    Ambient
                                </h1>
                            </div>
                        </div>
                        <TrackGlance />
                        <div className="bg-gray-100 dark:bg-gray-900 absolute size-full peer-[.lyrics-bg]:opacity-100 peer-[.lyrics-bg]:z-0 -z-10" />
                        <MaximizeLyricsButton
                            isMaximized={maximizeLyrics}
                            onClick={toggleMaximizeLyrics}
                        />
                        <LyricsDisplay />
                    </>
                )}
            </div>

            {!maximizeLyrics && (
                <SidebarMemo
                    playTrack={playTrack}
                    showLyrics={showLyrics}
                    toggleLyrics={toggleLyrics}
                />
            )}
        </div>
    );
});

const AppService: React.FC = () => {
    const lyricsRef = useLyricsRef();

    const queue = useQueue();
    const currentTrackIndex = useCurrentTrackIndex();
    const setCurrentTrackIndex = useCurrentTrackIndexDispatcher();
    const setCurrentTime = useCurrentTimeDispatcher();
    const setCurrentLyricIndex = useCurrentLyricIndexDispatcher();
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [loop, setLoop] = useState<"none" | "track" | "playlist">(getLoopMode);
    const audioRef = useAudioRef();
    const glanceRef = useGlanceRef();

    const toggleLoop = useCallback(() => {
        setLoop((prev) => {
            let newType: "none" | "track" | "playlist" = "none";
            if (prev === "none") newType = "track";
            else if (prev === "track") newType = "playlist";

            window.localStorage.setItem("loopMode", newType);
            return newType;
        });
    }, []);

    const playTrack = useCallback(async (track: Track, index: number, total: number) => {
        if (index < 0 || index >= total || !audioRef.current) {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setCurrentLyricIndex(-1);
            return;
        }

        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setCurrentLyricIndex(-1);

        setTimeout(() => lyricsRef.current && (lyricsRef.current.scrollTop = 0), 10);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current.currentTime = 0;
            audioRef.current.src = track.url;
            try {
                audioRef.current.load();
                await audioRef.current.play();
                setIsPlaying(true);

                const player = document.querySelector("div.group.audio-player");
                if (player) {
                    setTimeout(() => {
                        player.classList.add("expanded");
                        setTimeout(() => player.classList.remove("expanded"), 3000);
                    }, 1000);
                }
            } catch (err) {
                console.error("Playback error:", err);
                setIsPlaying(false);
            }
        }
    }, []);

    const resetState = useCallback(() => {
        setIsPlaying(false);
        setCurrentTrackIndex(-1);
        setCurrentTime(0);
        setCurrentLyricIndex(-1);
        if (audioRef.current) {
            audioRef.current.src = "";
        }
        glanceRef.current?.classList.toggle("lyrics-bg", false);
        glanceRef.current?.classList.toggle("lyrics", false);
    }, []);

    const handlePlay = useCallback(
        async (newIndex: number) => {
            console.log(queue.length, newIndex);
            await playTrack(queue[newIndex], newIndex, queue.length);
        },
        [queue]
    );

    const playNext = useCallback(async () => {
        if (currentTrackIndex + 1 < queue.length) await handlePlay(currentTrackIndex + 1);
        else if (loop === "playlist" && queue.length > 0) await handlePlay(0);
        else resetState();
    }, [currentTrackIndex, loop, queue]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    }, []);

    const handleEnded = useCallback(async () => {
        if (loop === "track" && currentTrackIndex >= 0) await handlePlay(currentTrackIndex);
        else await playNext();
    }, [currentTrackIndex, loop]);

    const loadedMetadata = useCallback(() => setDuration(audioRef.current?.duration || 0), []);

    return (
        <PlaylistProvider resetState={resetState}>
            <div className="container mx-auto p-2 sm:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen h-screen max-h-screen flex flex-col gap-2 sm:gap-4 overflow-auto">
                <AppContent playTrack={playTrack} />

                {/* Audio Player */}
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-40 max-w-[90%] sm:max-w-[400px]">
                    <AudioPlayerMemo
                        loadedMetadata={loadedMetadata}
                        handleTimeUpdate={handleTimeUpdate}
                        handleEnded={handleEnded}
                        islandComp={<AudioPlayerIslandMemo duration={duration} />}
                        trackComp={<AudioPlayerTrackMemo />}
                        controllerComp={
                            <AudioPlayerControllerMemo
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                loop={loop}
                                toggleLoop={toggleLoop}
                                handlePlay={handlePlay}
                                playNext={playNext}
                            />
                        }
                        timelineComp={<AudioPlayerTimelineMemo duration={duration} />}
                        volumeComp={<AudioPlayerVolumeMemo />}
                    />
                </div>
            </div>
        </PlaylistProvider>
    );
};

const App: React.FC = () => {
    return (
        <SharedRefProvider>
            <ServiceProvider>
                <SelectedTrackProvider>
                    <AppService />
                </SelectedTrackProvider>
            </ServiceProvider>
        </SharedRefProvider>
    );
};

export default App;
