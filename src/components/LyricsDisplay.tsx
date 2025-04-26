import React from "react";
import { LyricLine } from "../types";

interface LyricsDisplayProps {
    lyrics: LyricLine[];
    currentLyricIndex: number;
    lyricsRef: React.RefObject<HTMLDivElement | null>;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
    lyrics,
    currentLyricIndex,
    lyricsRef,
    audioRef,
    setCurrentTime,
}) => {
    const handleLyricClick = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-4 max-h-64 overflow-y-auto scroll-container"
            ref={lyricsRef}>
            {lyrics.length ? (
                lyrics.map((lyric, index) => (
                    <p
                        key={index}
                        className={`text-center py-1 cursor-pointer transition-all duration-300 ${
                            index === currentLyricIndex
                                ? "text-xellanix-600 dark:text-xellanix-300 text-xl tracking-wide font-bold opacity-100"
                                : "opacity-40 hover:opacity-80"
                        }`}
                        onClick={() => handleLyricClick(lyric.time)}>
                        {lyric.text}
                    </p>
                ))
            ) : (
                <p className="text-center text-gray-500">No lyrics available</p>
            )}
        </div>
    );
};

export default LyricsDisplay;
