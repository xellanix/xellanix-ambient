import React, { useState, useRef, useEffect } from "react";
import AudioPlayer from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import Playlist from "./components/Playlist";
import Queue from "./components/Queue";
import { Track, LyricLine } from "./types";
import { Button } from "./components/Button/Button";

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
    const [isIslandExpanded, setIsIslandExpanded] = useState<boolean>(false);
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

        let scrollTop = element.offsetTop - panel.offsetTop - (panelHeight - elementHeight) / 2;

        if (index === 0) {
            scrollTop = 0;
        } else if (index === totalLyrics - 1) {
            scrollTop = panel.scrollHeight - panelHeight;
        }

        panel.scrollTo({ top: scrollTop, behavior: "smooth" });
    };

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
            // Preserve the current track's position if it exists
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
    }, [playlist, shuffle]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle("dark");
    };

    const toggleLyrics = () => setShowLyrics(!showLyrics);
    const toggleShuffle = () => setShuffle(!shuffle);

    const toggleLoop = () => {
        setLoop((prev) => {
            if (prev === "none") return "track";
            if (prev === "track") return "playlist";
            return "none";
        });
    };

    const playTrack = async (track: Track) => {
        if (audioRef.current) {
            audioRef.current.pause();
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
        
        if (track.hasLyrics && track.lyricsUrl) {
            try {
                const response = await fetch(track.lyricsUrl);
                const content = await response.text();
                const lines = content.split("\n");
                const lyrics: LyricLine[] = [];
                const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

                for (const line of lines) {
                    const match = line.match(timeRegex);
                    if (match) {
                        const minutes = parseInt(match[1]);
                        const seconds = parseInt(match[2]);
                        const milliseconds = parseInt(match[3].padEnd(3, "0"));
                        const time = minutes * 60 + seconds + milliseconds / 1000;
                        const text = match[4].trim();
                        if (text) lyrics.push({ time, text });
                    }
                }
                setLyrics(lyrics);
            } catch (err) {
                console.error("Failed to load lyrics:", err);
                setLyrics([]);
            }
        } else {
            setLyrics([]);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl bg-gray-100 dark:bg-gray-900 min-h-screen relative">
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
                    setLyrics={setLyrics}
                    setCurrentLyricIndex={setCurrentLyricIndex}
                    audioRef={audioRef}
                    setIsPlaying={setIsPlaying}
                    setCurrentTime={setCurrentTime}
                    setDuration={setDuration}
                    setQueue={setQueue}
                    playTrack={playTrack}
                />
            ) : (
                <Queue
                    queue={queue}
                    currentTrackIndex={currentTrackIndex}
                    setCurrentTrackIndex={setCurrentTrackIndex}
                    setCurrentLyricIndex={setCurrentLyricIndex}
                    playTrack={playTrack}
                />
            )}
            <div
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-40"
                onMouseEnter={() => setIsIslandExpanded(true)}
                onMouseLeave={() => setIsIslandExpanded(false)}>
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
                    isIslandExpanded={isIslandExpanded}
                    playTrack={playTrack}
                />
            </div>
        </div>
    );
};

export default App;
