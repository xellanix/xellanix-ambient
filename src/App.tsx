import React, { useState, useRef, useEffect, useCallback } from "react";
import AudioPlayer from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import Playlist from "./components/Playlist";
import Queue from "./components/Queue";
import { Track } from "./types";
import { Button } from "./components/Button/Button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Moon02Icon,
    Playlist03Icon,
    Sorting04Icon,
    SpeechToTextIcon,
    Sun03Icon,
} from "@hugeicons-pro/core-solid-rounded";
import SliderRadioButton, { SliderOption } from "./components/SlideRadioButton";
import { TrackProvider } from "./hooks/useCurrentTrack";

const App: React.FC = () => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [queue, setQueue] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<"playlist" | "queue">("playlist");
    const [shuffle, setShuffle] = useState<boolean>(false);
    const [loop, setLoop] = useState<"none" | "track" | "playlist">("none");
    const [isIslandExpanded, setIsIslandExpanded] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsRef = useRef<HTMLDivElement | null>(null);
    const shuffleSignatureRef = useRef<string>("");

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

    useEffect(() => {
        const newSignature = `${shuffle}:${playlist.map((track) => track.url).join(",")}`;

        if (newSignature === shuffleSignatureRef.current) {
            return;
        }

        shuffleSignatureRef.current = newSignature;

        if (shuffle) {
            const shuffled = [...playlist].sort(() => Math.random() - 0.5);
            if (currentTrackIndex >= 0 && currentTrackIndex < queue.length) {
                const currentTrack = queue[currentTrackIndex];
                const newQueue = shuffled.filter((track) => track.url !== currentTrack.url);
                newQueue.splice(currentTrackIndex, 0, currentTrack);
                setQueue(newQueue);
            } else {
                setQueue(shuffled);
            }
        } else {
            setQueue([...playlist]);
        }
    }, [playlist, shuffle, currentTrackIndex]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => {
            const newMode = !prev;
            document.documentElement.classList.toggle("dark", newMode);
            return newMode;
        });
    }, []);

    const toggleLyrics = useCallback(() => setShowLyrics((prev) => !prev), []);
    const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), []);

    const toggleLoop = useCallback(() => {
        setLoop((prev) => {
            if (prev === "none") return "track";
            if (prev === "track") return "playlist";
            return "none";
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

    const changeSidebarView = useCallback((selectedIndex: number) => {
        switch (selectedIndex) {
            case 0:
                setViewMode("playlist");
                break;
            case 1:
                setViewMode("queue");
                break;
        }
    }, []);

    return (
        <TrackProvider value={{ current: currentTrackIndex, dispatch: setCurrentTrackIndex }}>
            <div className="container mx-auto p-2 sm:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col gap-2 sm:gap-4 overflow-hidden">
                {/* Header */}
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
                                icon={darkMode ? Sun03Icon : Moon02Icon}
                                stroke="0"
                                className="size-5"
                            />
                        </button>
                    </div>
                </div>

                {/* Main Content and Sidebar */}
                <div className="flex flex-col sm:flex-row gap-4 sm:h-[calc(100dvh-120px)]">
                    {/* Lyrics (Main Content) */}
                    <div className="flex flex-col flex-1 overflow-auto sm:h-full max-h-[calc(100dvh-120px)]">
                        {showLyrics && (
                            <LyricsDisplay
                                lyrics={
                                    currentTrackIndex >= 0 && currentTrackIndex < queue.length
                                        ? queue[currentTrackIndex]?.lyrics || []
                                        : []
                                }
                                currentLyricIndex={currentLyricIndex}
                                lyricsRef={lyricsRef}
                                audioRef={audioRef}
                                setCurrentTime={setCurrentTime}
                            />
                        )}
                    </div>

                    {/* Sidebar (Playlist/Queue) */}
                    <div className="w-full sm:w-1/4 sm:min-w-[300px] flex flex-col">
                        <div className="flex-1 bg-[var(--bg-primary)] rounded-lg flex flex-col h-full max-h-[50dvh] sm:max-h-full">
                            {/* Content Area */}
                            <div className="flex flex-col flex-1 p-4 h-full max-h-full overflow-hidden">
                                {viewMode === "playlist" ? (
                                    <Playlist
                                        playlist={playlist}
                                        setPlaylist={setPlaylist}
                                        queue={queue}
                                        setQueue={setQueue}
                                        playTrack={playTrack}
                                        resetState={resetState}
                                        className="!p-0 flex flex-col flex-1 overflow-hidden"
                                    />
                                ) : (
                                    <Queue
                                        queue={queue}
                                        playTrack={playTrack}
                                        className="!p-0 flex flex-col flex-1 overflow-hidden"
                                    />
                                )}
                            </div>
                            {/* Divider */}
                            <div className="border-t border-[var(--bg-tertiary)] mx-4" />
                            {/* Sliding Puzzle Switcher */}
                            <div className="relative p-4 flex justify-center items-center gap-2">
                                <SliderRadioButton
                                    className="w-16 h-9"
                                    onChange={changeSidebarView}>
                                    <SliderOption index={0}>
                                        <HugeiconsIcon
                                            icon={Playlist03Icon}
                                            stroke="0"
                                            className="size-4"
                                        />
                                    </SliderOption>
                                    <SliderOption index={1}>
                                        <HugeiconsIcon
                                            icon={Sorting04Icon}
                                            stroke="0"
                                            className="size-4"
                                        />
                                    </SliderOption>
                                </SliderRadioButton>
                                <Button
                                    styleType={showLyrics ? "accent" : "secondary"}
                                    onClick={toggleLyrics}
                                    className="w-8 h-7.5 [--button-p:theme(padding.2)]"
                                    title={showLyrics ? "Hide Lyrics" : "Show Lyrics"}>
                                    <HugeiconsIcon
                                        icon={showLyrics ? SpeechToTextIcon : SpeechToTextIcon}
                                        stroke="0"
                                        className="size-4"
                                    />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audio Player */}
                <div
                    className="fixed bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-40 max-w-[90%] sm:max-w-[400px]"
                    onMouseEnter={() => setIsIslandExpanded(true)}
                    onMouseLeave={() => setIsIslandExpanded(false)}>
                    <AudioPlayer
                        audioRef={audioRef}
                        queue={queue}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        currentTime={currentTime}
                        setCurrentTime={setCurrentTime}
                        duration={duration}
                        setDuration={setDuration}
                        shuffle={shuffle}
                        loop={loop}
                        toggleShuffle={toggleShuffle}
                        toggleLoop={toggleLoop}
                        isIslandExpanded={isIslandExpanded}
                        playTrack={playTrack}
                        resetState={resetState}
                    />
                </div>
            </div>
        </TrackProvider>
    );
};

export default App;
