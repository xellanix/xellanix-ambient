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
            className="p-6 rounded-lg shadow-md flex-1 gap-y-8 flex flex-col overflow-y-auto scroll-container [mask-image:linear-gradient(transparent,black_40%_60%,transparent)]"
            ref={lyricsRef}>
            <div className="min-h-[40%]" />
            {lyrics.length ? (
                lyrics.map((lyric, index) => (
                    <p
                        key={index}
                        className={`text-left text-3xl md:text-4xl lg:text-5xl py-1 cursor-pointer transition-all duration-300 ${
                            index === currentLyricIndex
                                ? "text-[var(--bg-accent)] font-bold opacity-100"
                                : "text-[var(--text-secondary)] opacity-20 hover:opacity-60"
                        }`}
                        onClick={() => handleLyricClick(lyric.time)}>
                        {lyric.text}
                    </p>
                ))
            ) : (
                <p className="text-center text-[var(--text-tertiary)]">No lyrics available</p>
            )}
            <div className="min-h-[40%]" />
        </div>
    );
};

export default LyricsDisplay;
