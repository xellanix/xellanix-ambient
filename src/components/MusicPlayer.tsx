import React, { useRef, useState, useEffect } from "react";
import Lyric from "lrc-file-parser";

// Extend the Lyric type to include the undocumented 'lines' property
declare module "lrc-file-parser" {
    interface Lyric {
        lines: { time: number; content: string; text: string }[];
    }
}

const MusicPlayer: React.FC<{ song: string; lrc: string }> = ({ song, lrc }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
    const [activeLyricIndex, setActiveLyricIndex] = useState<number | null>(null); // Use index instead of text
    const [buffered, setBuffered] = useState(0);

    useEffect(() => {
        const parser = new Lyric({
            onPlay: (line: number, text: string) => {
                console.log("Playing line:", line, text);
            },
        });

        fetch(lrc)
            .then((res) => res.text())
            .then((lrcText) => {
                parser.setLyric(lrcText);
                const lines = parser.lines.map((line) => ({
                    time: line.time / 1000, // Convert ms to seconds
                    text: line.text,
                }));
                setLyrics(lines);
                console.log("Parsed lyrics:", lines);
            })
            .catch((err) => console.error("Error fetching/parsing LRC:", err));
    }, [lrc]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const currentTime = audioRef.current.currentTime;
            const currentIndex = lyrics.findIndex(
                (l, i) =>
                    currentTime >= l.time &&
                    (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time)
            );
            setActiveLyricIndex(currentIndex !== -1 ? currentIndex : null);
            try {
                setBuffered((audioRef.current.buffered.end(0) / audioRef.current.duration) * 100);
            } catch (e) {
                setBuffered(0);
            }
        }
    };

    const handleLyricClick = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <audio
                ref={audioRef}
                src={song}
                controls
                onTimeUpdate={handleTimeUpdate}
                preload="auto"
                className="w-full mb-4"
            />
            <div className="w-full bg-gray-200 h-2 mb-4">
                <div className="bg-blue-500 h-2" style={{ width: `${buffered}%` }} />
            </div>
            <div className="h-64 overflow-y-auto">
                {lyrics.map((line, index) => (
                    <p
                        key={index}
                        onClick={() => handleLyricClick(line.time)}
                        className={`cursor-pointer text-center py-1 ${
                            index === activeLyricIndex
                                ? "text-green-500 font-bold"
                                : "text-gray-700"
                        }`}>
                        {line.text}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default MusicPlayer;
