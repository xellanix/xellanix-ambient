import React from "react";
import { Track, LyricLine } from "../types";

interface QueueProps {
    queue: Track[];
    currentTrackIndex: number;
    setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>;
    setLyrics: React.Dispatch<React.SetStateAction<LyricLine[]>>;
    setCurrentLyricIndex: React.Dispatch<React.SetStateAction<number>>;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
}

const Queue: React.FC<QueueProps> = ({
    queue,
    currentTrackIndex,
    setCurrentTrackIndex,
    setLyrics,
    setCurrentLyricIndex,
    audioRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
}) => {
    const changeTrack = async (index: number) => {
        setCurrentTrackIndex(index);
        setCurrentLyricIndex(-1);

        const track = queue[index];

        // Load lyrics if available
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
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Queue</h2>
            <ul>
                {queue.map((track, index) => (
                    <li
                        key={index}
                        className={`flex items-center justify-between p-2 cursor-pointer rounded-md transition-colors ${
                            index === currentTrackIndex
                                ? "bg-gray-200 dark:bg-gray-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => changeTrack(index)}>
                        <div className="flex items-center text-gray-900 dark:text-gray-200">
                            {track.hasLyrics && <span className="mr-2">🎵</span>}
                            <span>{track.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {track.codec}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Queue;
