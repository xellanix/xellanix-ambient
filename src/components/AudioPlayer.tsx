import React, { useState } from "react";
import { Track, LyricLine } from "../types";

interface AudioPlayerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playlist: Track[];
    queue: Track[];
    currentTrackIndex: number;
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    currentTime: number;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    duration: number;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>;
    setLyrics: React.Dispatch<React.SetStateAction<LyricLine[]>>;
    setCurrentLyricIndex: React.Dispatch<React.SetStateAction<number>>;
    shuffle: boolean;
    loop: "none" | "track" | "playlist";
    toggleShuffle: () => void;
    toggleLoop: () => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const parseLrc = (lrcContent: string): LyricLine[] => {
    const lines = lrcContent.split("\n");
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
    return lyrics;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioRef,
    queue,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    setCurrentTrackIndex,
    setLyrics,
    setCurrentLyricIndex,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
}) => {
    const [volume, setVolume] = useState<number>(1);

    const togglePlay = () => {
        if (audioRef.current && currentTrackIndex >= 0) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().catch((err) => {
                    console.error("Playback error:", err);
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = parseFloat(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const playTrack = async (index: number) => {
        if (index < 0 || index >= queue.length || !audioRef.current) {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setLyrics([]);
            setCurrentLyricIndex(-1);
            return;
        }

        // Reset state for new track
        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setLyrics([]);
        setCurrentLyricIndex(-1);

        // Load lyrics if available
        const track = queue[index];
        if (track.hasLyrics && track.lyricsUrl) {
            try {
                const response = await fetch(track.lyricsUrl);
                const content = await response.text();
                setLyrics(parseLrc(content));
            } catch (err) {
                console.error("Failed to load lyrics:", err);
                setLyrics([]);
            }
        }

        // Load and play track
        audioRef.current.src = track.url;
        try {
            await audioRef.current.load();
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("Playback error:", err);
            setIsPlaying(false);
            // Retry playback after a short delay (handles some browser autoplay issues)
            setTimeout(async () => {
                try {
                    await audioRef.current?.play();
                    setIsPlaying(true);
                } catch (retryErr) {
                    console.error("Retry playback error:", retryErr);
                    setIsPlaying(false);
                }
            }, 100);
        }
    };

    const handleEnded = async () => {
        if (loop === "track" && currentTrackIndex >= 0) {
            await playTrack(currentTrackIndex); // Replay current track
        } else if (currentTrackIndex + 1 < queue.length) {
            // Play next track in queue
            await playTrack(currentTrackIndex + 1);
        } else if (loop === "playlist" && queue.length > 0) {
            // Restart queue
            await playTrack(0);
        } else {
            // No loop, stop playback
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setLyrics([]);
            setCurrentLyricIndex(-1);
        }
    };

    const isTrackSelected = currentTrackIndex >= 0 && currentTrackIndex < queue.length;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <audio
                ref={audioRef}
                src={isTrackSelected ? queue[currentTrackIndex]?.url : undefined}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            />
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                {isTrackSelected ? queue[currentTrackIndex]?.name : "No track selected"}
            </h2>
            <div className="flex items-center mb-4">
                <button
                    onClick={togglePlay}
                    className="p-3 bg-blue-500 dark:bg-blue-600 text-white rounded-full mr-3 hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!isTrackSelected}>
                    {isPlaying ? "⏸" : "▶️"}
                </button>
                <div className="flex-1">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full progress-bar h-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isTrackSelected}
                        style={{ "--progress": `${(currentTime / (duration || 1)) * 100}%` } as any}
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="flex items-center">
                    <label className="text-gray-600 dark:text-gray-300 mr-2">Volume:</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-2 rounded-lg cursor-pointer bg-gray-300 dark:bg-gray-600"
                    />
                </div>
                <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-full transition-colors ${
                        shuffle
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                    title={shuffle ? "Disable Shuffle" : "Enable Shuffle"}>
                    🔀
                </button>
                <button
                    onClick={toggleLoop}
                    className={`p-2 rounded-full transition-colors ${
                        loop !== "none"
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                    title={
                        loop === "none"
                            ? "Loop Track"
                            : loop === "track"
                            ? "Loop Playlist"
                            : "Disable Loop"
                    }>
                    {loop === "track" ? "🔂" : "🔁"}
                </button>
            </div>
        </div>
    );
};

export default AudioPlayer;
