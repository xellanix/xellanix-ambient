import React, { useRef } from "react";
import { Track, LyricLine } from "../types";
import { Button } from "./Button/Button";

interface PlaylistProps {
    playlist: Track[];
    setPlaylist: React.Dispatch<React.SetStateAction<Track[]>>;
    currentTrackIndex: number;
    setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>;
    setLyrics: React.Dispatch<React.SetStateAction<LyricLine[]>>;
    setCurrentLyricIndex: React.Dispatch<React.SetStateAction<number>>;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
}

const Playlist: React.FC<PlaylistProps> = ({
    playlist,
    setPlaylist,
    currentTrackIndex,
    setCurrentTrackIndex,
    setLyrics,
    setCurrentLyricIndex,
    audioRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setQueue,
}) => {
    const audioInputRef = useRef<HTMLInputElement>(null);
    const lyricInputRef = useRef<HTMLInputElement>(null);

    const handleAddTrack = () => {
        audioInputRef.current?.click();
    };

    const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const audioFiles = e.target.files;
        if (!audioFiles || audioFiles.length === 0) return;

        lyricInputRef.current?.click();
        const lyricFiles = lyricInputRef.current?.files;

        const newTracks: Track[] = [];
        for (let i = 0; i < audioFiles.length; i++) {
            const file = audioFiles[i];
            const lyricFile =
                lyricFiles && lyricFiles[i] && lyricFiles[i].name.includes(".lrc")
                    ? lyricFiles[i]
                    : null;

            const newTrack: Track = {
                name: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                url: URL.createObjectURL(file),
                hasLyrics: lyricFile !== null,
                lyricsUrl: lyricFile ? URL.createObjectURL(lyricFile) : undefined,
                album: "Unknown Album",
                file,
                codec: file.type,
            };
            newTracks.push(newTrack);
        }

        setPlaylist((prev) => [...prev, ...newTracks]);
        setQueue((prev) => [...prev, ...newTracks]);

        if (audioInputRef.current) audioInputRef.current.value = "";
        if (lyricInputRef.current) lyricInputRef.current.value = "";
    };

    const handleLyricFileChange = () => {
        // Triggered to allow lyric file selection
    };

    const handleRemoveTrack = (index: number) => {
        setPlaylist((prev) => {
            const newPlaylist = prev.filter((_, i) => i !== index);
            if (index === currentTrackIndex) {
                setCurrentTrackIndex(-1);
                setIsPlaying(false);
                setCurrentTime(0);
                setDuration(0);
                setLyrics([]);
                setCurrentLyricIndex(-1);
                if (audioRef.current) {
                    audioRef.current.src = "";
                }
            } else if (index < currentTrackIndex) {
                setCurrentTrackIndex((prevIndex) => prevIndex - 1);
            }
            return newPlaylist;
        });
        setQueue((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePlayTrack = (index: number) => {
        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setLyrics([]);
        setCurrentLyricIndex(-1);

        const track = playlist[index];
        if (audioRef.current) {
            audioRef.current.src = track.url;
            audioRef.current
                .play()
                .then(() => {
                    setIsPlaying(true);
                    setDuration(audioRef.current?.duration || 0);
                })
                .catch((err) => {
                    console.error("Playback error:", err);
                    setIsPlaying(false);
                });
        }

        if (track.hasLyrics && track.lyricsUrl) {
            fetch(track.lyricsUrl)
                .then((response) => response.text())
                .then((content) => {
                    const parsedLyrics: LyricLine[] = content
                        .split("\n")
                        .map((line) => {
                            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
                            if (match) {
                                const minutes = parseInt(match[1]);
                                const seconds = parseInt(match[2]);
                                const milliseconds = parseInt(match[3].padEnd(3, "0"));
                                const time = minutes * 60 + seconds + milliseconds / 1000;
                                const text = match[4].trim();
                                return text ? { time, text } : null;
                            }
                            return null;
                        })
                        .filter((line): line is LyricLine => line !== null);
                    setLyrics(parsedLyrics);
                })
                .catch((err) => {
                    console.error("Failed to load lyrics:", err);
                    setLyrics([]);
                });
        }
    };

    return (
        <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-[var(--text-normal)] mb-4">Playlist</h2>
            <Button styleType="accent" onClick={handleAddTrack}>
                Add Track
            </Button>
            <input
                type="file"
                accept="audio/*"
                multiple
                ref={audioInputRef}
                onChange={handleAudioFileChange}
                className="hidden"
            />
            <input
                type="file"
                accept=".lrc"
                multiple
                ref={lyricInputRef}
                onChange={handleLyricFileChange}
                className="hidden"
            />
            <ul className="space-y-2">
                {playlist.map((track, index) => (
                    <li
                        key={index}
                        className={`flex justify-between items-center p-2 rounded-lg ${
                            index === currentTrackIndex
                                ? "bg-blue-100 dark:bg-blue-900"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}>
                        <div
                            className="flex-1 cursor-pointer truncate"
                            onClick={() => handlePlayTrack(index)}>
                            <span className="text-[var(--text-normal)]">{track.name}</span>
                            {track.artist && (
                                <span className="text-sm text-[var(--text-secondary)] ml-2">
                                    - {track.artist}
                                </span>
                            )}
                            {track.codec && (
                                <span className="text-sm text-[var(--text-tertiary)] ml-2">
                                    ({track.codec})
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => handleRemoveTrack(index)}
                            className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 transition-colors"
                            title="Remove Track">
                            🗑️
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Playlist;
