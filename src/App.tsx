import React, { useState, useRef, useEffect, useCallback } from "react";
import AudioPlayer from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import Playlist from "./components/Playlist";
import Queue from "./components/Queue";
import { Track } from "./types";
import { Button } from "./components/Button/Button";

const App: React.FC = () => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [queue, setQueue] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1); // New state for currentLyricIndex
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<"playlist" | "queue">("playlist");
    const [shuffle, setShuffle] = useState<boolean>(false);
    const [loop, setLoop] = useState<"none" | "track" | "playlist">("none");
    const [isIslandExpanded, setIsIslandExpanded] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsRef = useRef<HTMLDivElement | null>(null);
    const shuffleSignatureRef = useRef<string>("");

    const scrollIntoPanel = useCallback(
        (element: HTMLElement, index: number, totalLyrics: number) => {
            if (!lyricsRef.current) return;

            const panel = lyricsRef.current;
            const panelRect = panel.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const panelHeight = panelRect.height;
            const elementHeight = elementRect.height;

            let scrollTop = element.offsetTop - panel.offsetTop - (panelHeight - elementHeight) / 2;

            if (index === 0) {
                scrollTop = 0;
            } else if (index === totalLyrics - 1) {
                scrollTop = panel.scrollHeight - panelHeight;
            }

            panel.scrollTo({ top: scrollTop, behavior: "smooth" });
        },
        []
    );

    // Update currentLyricIndex based on currentTime and currentTrackIndex
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

            if (lyricsRef.current && index >= 0) {
                const lyricElement = lyricsRef.current.children[index] as HTMLElement;
                scrollIntoPanel(lyricElement, index, track.lyrics.length);
            }
        }
    }, [currentTime, currentTrackIndex, queue, scrollIntoPanel, currentLyricIndex]);

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
            setCurrentLyricIndex(-1); // Reset to trigger highlighting of the first lyric

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

    return (
        <div className="container mx-auto p-4 bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-normal)]">Music Player</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={toggleLyrics}
                        className="p-2 rounded-full bg-[var(--bg-secondary)] text-gray-800 dark:text-gray-200 hover:bg-[var(--bg-tertiary)] transition-colors"
                        title={showLyrics ? "Hide Lyrics" : "Show Lyrics"}>
                        {showLyrics ? "🎵" : "🎵"}
                    </button>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full bg-[var(--bg-secondary)] text-gray-800 dark:text-gray-200 hover:bg-[var(--bg-tertiary)] transition-colors"
                        title={darkMode ? "Light Mode" : "Dark Mode"}>
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                </div>
            </div>

            {/* Main Content and Sidebar */}
            <div className="flex flex-row gap-4 flex-1">
                {/* Lyrics (Main Content) */}
                <div className="flex-1">
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
                <div className="w-1/4 min-w-[300px] flex flex-col gap-2">
                    <div className="flex space-x-2">
                        <Button
                            styleType={viewMode === "playlist" ? "accent" : "primary"}
                            onClick={() => setViewMode("playlist")}>
                            Playlist
                        </Button>
                        <Button
                            styleType={viewMode === "queue" ? "accent" : "primary"}
                            onClick={() => setViewMode("queue")}>
                            Queue
                        </Button>
                    </div>
                    {viewMode === "playlist" ? (
                        <Playlist
                            playlist={playlist}
                            setPlaylist={setPlaylist}
                            currentTrackIndex={currentTrackIndex}
                            setCurrentTrackIndex={setCurrentTrackIndex}
                            audioRef={audioRef}
                            setIsPlaying={setIsPlaying}
                            setCurrentTime={setCurrentTime}
                            setDuration={setDuration}
                            setQueue={setQueue}
                            playTrack={playTrack}
                            resetState={resetState}
                        />
                    ) : (
                        <Queue
                            queue={queue}
                            currentTrackIndex={currentTrackIndex}
                            playTrack={playTrack}
                        />
                    )}
                </div>
            </div>

            {/* Audio Player */}
            <div
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-40"
                onMouseEnter={() => setIsIslandExpanded(true)}
                onMouseLeave={() => setIsIslandExpanded(false)}>
                <AudioPlayer
                    audioRef={audioRef}
                    queue={queue}
                    currentTrackIndex={currentTrackIndex}
                    setCurrentTrackIndex={setCurrentTrackIndex}
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
    );
};

export default App;
