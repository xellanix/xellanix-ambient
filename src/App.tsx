import React, { useState, useRef, useEffect } from "react";
import AudioPlayer from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import Playlist from "./components/Playlist";
import { Track, LyricLine } from "./types";

const App: React.FC = () => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const audioRef = useRef<HTMLAudioElement>(null);
    const lyricsRef = useRef<HTMLDivElement>(null);

    // Sync lyrics with current time
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
        }
    }, [currentTime, lyrics, currentLyricIndex]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle("dark");
    };

    const toggleLyrics = () => {
        setShowLyrics(!showLyrics);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Music Player</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={toggleLyrics}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        {showLyrics ? "🎵 Hide Lyrics" : "🎵 Show Lyrics"}
                    </button>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
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
            />
        </div>
    );
};

export default App;
