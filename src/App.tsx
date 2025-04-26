import React, { useState, useRef, useEffect } from "react";
import AudioPlayer from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import Playlist from "./components/Playlist";
import Queue from "./components/Queue";
import { Track, LyricLine } from "./types";

const App: React.FC = () => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [queue, setQueue] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<"playlist" | "queue">("playlist");
    const [shuffle, setShuffle] = useState<boolean>(false);
    const [loop, setLoop] = useState<"none" | "track" | "playlist">("none");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsRef = useRef<HTMLDivElement | null>(null);

    // Custom scroll function to center lyric within panel
    const scrollIntoPanel = (element: HTMLElement, index: number, totalLyrics: number) => {
        if (!lyricsRef.current) return;

        const panel = lyricsRef.current;
        const panelRect = panel.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const panelHeight = panelRect.height;
        const elementHeight = elementRect.height;

        // Calculate desired scroll position to center the element
        let scrollTop = element.offsetTop - panel.offsetTop - (panelHeight - elementHeight) / 2;

        // Adjust for start and end of lyrics
        if (index === 0) {
            scrollTop = 0; // Scroll to top for first lyric
        } else if (index === totalLyrics - 1) {
            scrollTop = panel.scrollHeight - panelHeight; // Scroll to bottom for last lyric
        }

        // Apply smooth scrolling
        panel.scrollTo({ top: scrollTop, behavior: "smooth" });
    };

    // Sync lyrics with current time and handle scroll
    useEffect(() => {
        if (lyrics.length && currentTime) {
            const index = lyrics.findIndex((lyric, i) => {
                const nextTime = lyrics[i + 1]?.time || Infinity;
                return currentTime >= lyric.time && currentTime < nextTime;
            });
            if (index !== currentLyricIndex) {
                setCurrentLyricIndex(index);
                if (lyricsRef.current && index >= 0) {
                    const lyricElement = lyricsRef.current.children[index] as HTMLElement;
                    scrollIntoPanel(lyricElement, index, lyrics.length);
                }
            }
        } else if (lyricsRef.current && (currentTime === 0 || !lyrics.length)) {
            lyricsRef.current.scrollTop = 0;
        }
    }, [currentTime, lyrics, currentLyricIndex, currentTrackIndex]);

    // Update queue when playlist or shuffle changes
    useEffect(() => {
        if (shuffle) {
            const shuffled = [...playlist].sort(() => Math.random() - 0.5);
            setQueue(shuffled);
        } else {
            setQueue([...playlist]);
        }
    }, [playlist, shuffle]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle("dark");
    };

    const toggleLyrics = () => {
        setShowLyrics(!showLyrics);
    };

    const toggleShuffle = () => {
        setShuffle(!shuffle);
    };

    const toggleLoop = () => {
        setLoop((prev) => {
            if (prev === "none") return "track";
            if (prev === "track") return "playlist";
            return "none";
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Music Player</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={toggleLyrics}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title={showLyrics ? "Hide Lyrics" : "Show Lyrics"}>
                        {showLyrics ? "🎵" : "🎵"}
                    </button>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title={darkMode ? "Light Mode" : "Dark Mode"}>
                        {darkMode ? "☀️" : "🌙"}
                    </button>
                </div>
            </div>
            <AudioPlayer
                audioRef={audioRef}
                playlist={playlist}
                queue={queue}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                setDuration={setDuration}
                setCurrentTrackIndex={setCurrentTrackIndex}
                setLyrics={setLyrics}
                setCurrentLyricIndex={setCurrentLyricIndex}
                shuffle={shuffle}
                loop={loop}
                toggleShuffle={toggleShuffle}
                toggleLoop={toggleLoop}
            />
            {showLyrics && (
                <LyricsDisplay
                    lyrics={lyrics}
                    currentLyricIndex={currentLyricIndex}
                    lyricsRef={lyricsRef}
                    audioRef={audioRef}
                    setCurrentTime={setCurrentTime}
                />
            )}
            <div className="flex space-x-2 mb-4">
                <button
                    onClick={() => setViewMode("playlist")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        viewMode === "playlist"
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}>
                    Playlist
                </button>
                <button
                    onClick={() => setViewMode("queue")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        viewMode === "queue"
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}>
                    Queue
                </button>
            </div>
            {viewMode === "playlist" ? (
                <Playlist
                    playlist={playlist}
                    setPlaylist={setPlaylist}
                    currentTrackIndex={currentTrackIndex}
                    setCurrentTrackIndex={setCurrentTrackIndex}
                    setLyrics={setLyrics}
                    setCurrentLyricIndex={setCurrentLyricIndex}
                    audioRef={audioRef}
                    setIsPlaying={setIsPlaying}
                    setCurrentTime={setCurrentTime}
                    setDuration={setDuration}
                    setQueue={setQueue}
                />
            ) : (
                <Queue
                    queue={queue}
                    currentTrackIndex={currentTrackIndex}
                    setCurrentTrackIndex={setCurrentTrackIndex}
                    setLyrics={setLyrics}
                    setCurrentLyricIndex={setCurrentLyricIndex}
                    audioRef={audioRef}
                    setIsPlaying={setIsPlaying}
                    setCurrentTime={setCurrentTime}
                    setDuration={setDuration}
                />
            )}
        </div>
    );
};

export default App;
