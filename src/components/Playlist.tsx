import React, { useState } from "react";
import { Track, LyricLine } from "../types";

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
}

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

const detectCodec = (file: File): string => {
    const type = file.type;
    const name = file.name.toLowerCase();
    if (type.includes("mpeg") || name.endsWith(".mp3")) return "MP3";
    if (type.includes("wav") || name.endsWith(".wav")) return "WAV";
    if (type.includes("aac") || name.endsWith(".aac")) return "AAC";
    if (type.includes("flac") || name.endsWith(".flac")) return "FLAC";
    if (type.includes("x-m4a") || name.endsWith(".m4a")) return "ALAC";
    if (name.endsWith(".eac3")) return "EAC3";
    return "Unknown";
};

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
}) => {
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const lrcFiles = Array.from(files).filter((f) => f.name.endsWith(".lrc"));
            const audioFiles = Array.from(files).filter((f) => f.type.startsWith("audio/"));

            const newTracks = audioFiles.map((file) => {
                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const lrcFile = lrcFiles.find((lrc) => lrc.name.replace(".lrc", "") === baseName);
                return {
                    file,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    hasLyrics: !!lrcFile,
                    lyricsUrl: lrcFile ? URL.createObjectURL(lrcFile) : undefined,
                    codec: detectCodec(file),
                };
            });

            setPlaylist((prev) => [...prev, ...newTracks]);

            if (newTracks.length > 0 && newTracks[0].hasLyrics && newTracks[0].lyricsUrl) {
                fetch(newTracks[0].lyricsUrl)
                    .then((res) => res.text())
                    .then((content) => setLyrics(parseLrc(content)));
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        const lrcFiles = Array.from(files).filter((f) => f.name.endsWith(".lrc"));
        const audioFiles = Array.from(files).filter((f) => f.type.startsWith("audio/"));

        const newTracks = audioFiles.map((file) => {
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const lrcFile = lrcFiles.find((lrc) => lrc.name.replace(".lrc", "") === baseName);
            return {
                file,
                url: URL.createObjectURL(file),
                name: file.name,
                hasLyrics: !!lrcFile,
                lyricsUrl: lrcFile ? URL.createObjectURL(lrcFile) : undefined,
                codec: detectCodec(file),
            };
        });

        setPlaylist((prev) => [...prev, ...newTracks]);

        if (newTracks.length > 0 && newTracks[0].hasLyrics && newTracks[0].lyricsUrl) {
            fetch(newTracks[0].lyricsUrl)
                .then((res) => res.text())
                .then((content) => setLyrics(parseLrc(content)));
        }
    };

    const changeTrack = async (index: number) => {
        setCurrentTrackIndex(index);
        setCurrentLyricIndex(-1);
        setError(null);

        const track = playlist[index];

        // Load lyrics if available
        if (track.hasLyrics && track.lyricsUrl) {
            try {
                const response = await fetch(track.lyricsUrl);
                const content = await response.text();
                setLyrics(parseLrc(content));
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
                setError(`Failed to play ${track.name}. Ensure the format is supported.`);
                setIsPlaying(false);

                // Fallback for ALAC/EAC3
                if (track.name.endsWith(".m4a") || track.name.endsWith(".eac3")) {
                    try {
                        const arrayBuffer = await track.file.arrayBuffer();
                        const audioContext = new (window.AudioContext ||
                            (window as any).webkitAudioContext)();
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContext.destination);
                        source.start();
                        setIsPlaying(true);
                    } catch (fallbackErr) {
                        console.error("Fallback error:", fallbackErr);
                        setError(
                            `Failed to play ${track.name}. Codec may be unsupported (ALAC/EAC3).`
                        );
                        setIsPlaying(false);
                    }
                }
            }
        }
    };

    const removeTrack = (index: number) => {
        const track = playlist[index];
        URL.revokeObjectURL(track.url);
        if (track.lyricsUrl) {
            URL.revokeObjectURL(track.lyricsUrl);
        }
        setPlaylist((prev) => prev.filter((_, i) => i !== index));

        if (index === currentTrackIndex) {
            setCurrentTrackIndex(-1);
            setLyrics([]);
            setCurrentLyricIndex(-1);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        } else if (index < currentTrackIndex) {
            setCurrentTrackIndex((prev) => prev - 1);
        }
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}>
            <h2 className="text-lg font-semibold mb-2">Playlist</h2>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <label className="block mb-4">
                <span className="inline-block px-4 py-2 bg-xellanix-600 dark:bg-xellanix-300 text-white rounded-lg cursor-pointer hover:bg-xellanix-600 ">
                    Add Files
                </span>
                <input
                    type="file"
                    multiple
                    accept="audio/*,.lrc"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </label>
            <ul>
                {playlist
                    .filter((track) => !track.name.endsWith(".lrc"))
                    .map((track, index) => (
                        <li
                            key={index}
                            className={`flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                index === currentTrackIndex ? "bg-gray-200 dark:bg-gray-600" : ""
                            }`}
                            onClick={() => changeTrack(index)}>
                            <div className="flex items-center">
                                {track.hasLyrics && <span className="mr-2">🎵</span>}
                                <span>{track.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">{track.codec}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTrack(index);
                                    }}
                                    className="text-red-500 hover:text-red-700">
                                    ✕
                                </button>
                            </div>
                        </li>
                    ))}
            </ul>
        </div>
    );
};

export default Playlist;
