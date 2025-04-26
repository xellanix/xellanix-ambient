import React from "react";
import { LyricLine } from "../types";

interface LyricsDisplayProps {
    lyrics: LyricLine[];
    currentLyricIndex: number;
    lyricsRef: React.RefObject<HTMLDivElement>;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ lyrics, currentLyricIndex, lyricsRef }) => {
    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-4 max-h-64 overflow-y-auto scroll-container"
            ref={lyricsRef}>
            {lyrics.length ? (
                lyrics.map((lyric, index) => (
                    <p
                        key={index}
                        className={`text-center py-1 ${
                            index === currentLyricIndex ? "lyric-active" : ""
                        }`}>
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
