import React, { useState, useRef, useEffect } from "react";
import AudioPlayer from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import Playlist from "./components/Playlist";
import { Track, LyricLine } from "./types";

const App: React.FC = () => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsRef = useRef<HTMLDivElement | null>(null);

    // Sync lyrics with current time and handle scroll reset
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
                    lyricElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }
        } else if (lyricsRef.current && (currentTime === 0 || !lyrics.length)) {
            // Scroll to top when track changes or replays
            lyricsRef.current.scrollTop = 0;
        }
    }, [currentTime, lyrics, currentLyricIndex, currentTrackIndex]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle("dark");
    };

    const toggleLyrics = () => {
        setShowLyrics(!showLyrics);
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
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                setDuration={setDuration}
                setCurrentTrackIndex={setCurrentTrackIndex}
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
            />
        </div>
    );
};

export default App;
