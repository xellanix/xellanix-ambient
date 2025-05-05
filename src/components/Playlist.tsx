import React, { useRef, useCallback } from "react";
import { Track, LyricLine } from "../types";
import { Button } from "./Button/Button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon } from "@hugeicons-pro/core-solid-rounded";
import { cn } from "../lib/utils";
import { useCurrentTrack } from "../hooks/useCurrentTrack";

interface PlaylistProps {
    playlist: Track[];
    setPlaylist: React.Dispatch<React.SetStateAction<Track[]>>;
    queue: Track[];
    setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
    playTrack: (track: Track, index: number) => Promise<void>;
    resetState: () => void;
    className?: string;
}

let playlistId = 0;

const Playlist: React.FC<PlaylistProps> = ({
    playlist,
    setPlaylist,
    queue,
    setQueue,
    playTrack,
    resetState,
    className,
}) => {
    const [current, dispatch] = useCurrentTrack();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddTrack = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const fetchLyrics = useCallback(async (lyricsUrl: string): Promise<LyricLine[]> => {
        try {
            const response = await fetch(lyricsUrl);
            const content = await response.text();
            const lines = content.split("\n");
            const lyrics: LyricLine[] = [];
            const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/;

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
        } catch (err) {
            console.error("Failed to load lyrics:", err);
            return [];
        }
    }, []);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const audioFiles: File[] = [];
            const lyricFiles: File[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.endsWith(".lrc")) {
                    lyricFiles.push(file);
                } else if (file.type.startsWith("audio/")) {
                    audioFiles.push(file);
                }
            }

            const newTracks: Track[] = [];
            for (const audioFile of audioFiles) {
                const baseName = audioFile.name.replace(/\.[^/.]+$/, "");
                const lyricFile = lyricFiles.find((lyric) => lyric.name === `${baseName}.lrc`);
                const lyricsUrl = lyricFile ? URL.createObjectURL(lyricFile) : undefined;
                const lyrics = lyricsUrl ? await fetchLyrics(lyricsUrl) : [];

                const newTrack: Track = {
                    id: playlistId++,
                    name: audioFile.name.replace(/\.[^/.]+$/, ""),
                    artist: "Unknown Artist",
                    url: URL.createObjectURL(audioFile),
                    hasLyrics: !!lyricFile,
                    lyricsUrl,
                    lyrics,
                    currentLyricIndex: -1,
                    album: "Unknown Album",
                    file: audioFile,
                    codec: audioFile.type,
                };
                newTracks.push(newTrack);
            }

            setPlaylist((prev) => [...prev, ...newTracks]);
            setQueue((prev) => [...prev, ...newTracks]);

            if (fileInputRef.current) fileInputRef.current.value = "";
        },
        [fetchLyrics, setPlaylist, setQueue]
    );

    const handleRemoveTrack = useCallback(
        (index: number) => {
            setPlaylist((prev) => {
                const newPlaylist = prev.filter((_, i) => i !== index);
                if (index === current) {
                    resetState();
                }
                return newPlaylist;
            });
            setQueue((prev) => {
                const newQueue = prev.filter((_, i) => i !== index);
                if (index <= current && current >= 0 && current < prev.length) {
                    const currentTrack = prev[current];
                    const newIndex = newQueue.findIndex((track) => track.id === currentTrack.id);
                    dispatch(newIndex);

                    console.log(newIndex);
                }
                return newQueue;
            });
        },
        [current, resetState, dispatch, setPlaylist, setQueue]
    );

    const handlePlayTrack = useCallback(
        async (index: number) => {
            const track = playlist[index];
            const queueIndex = queue.findIndex((t) => t.id === track.id);
            await playTrack(track, queueIndex);
        },
        [playTrack, playlist, queue]
    );

    return (
        <div className={className}>
            <div className="flex flex-row mb-2 sm:mb-4 items-center">
                <h2 className="flex-1 text-lg sm:text-xl font-semibold text-[var(--text-normal)]">
                    Playlist
                </h2>
                <div>
                    <Button
                        styleType="accent"
                        onClick={handleAddTrack}
                        className="w-8 h-7.5 [--button-p:theme(padding.2)]"
                        title="Add Track">
                        <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={0} />
                    </Button>
                    <input
                        type="file"
                        accept="audio/*,.lrc"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <ul className="space-y-1 sm:space-y-2">
                    {playlist.map((track, index) => (
                        <li
                            key={index}
                            className={cn(
                                "flex justify-between items-center p-2 rounded-lg",
                                track.id === queue[current]?.id
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700",
                                "hover:[&>.btn]:visible text-sm sm:text-base"
                            )}>
                            <div
                                className="flex-1 cursor-pointer truncate"
                                onClick={() => handlePlayTrack(index)}>
                                <span className="text-[var(--text-normal)]">{track.name}</span>
                                {track.artist && (
                                    <span className="text-xs sm:text-sm text-[var(--text-secondary)] ml-1 sm:ml-2">
                                        - {track.artist}
                                    </span>
                                )}
                                {track.codec && (
                                    <span className="text-xs sm:text-sm text-[var(--text-tertiary)] ml-1 sm:ml-2">
                                        ({track.codec})
                                    </span>
                                )}
                            </div>
                            <Button
                                styleType="secondary"
                                title="Remove Track"
                                className="invisible size-5 sm:size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                                onClick={() => handleRemoveTrack(index)}>
                                <HugeiconsIcon
                                    icon={Cancel01Icon}
                                    className="size-2 sm:size-3"
                                    strokeWidth={1}
                                    color="var(--text-tertiary)"
                                />
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default React.memo(Playlist);
