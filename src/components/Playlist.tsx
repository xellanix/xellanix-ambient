import React, { useRef, useCallback } from "react";
import { Track } from "../types";
import { Button } from "./Button/Button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon } from "@hugeicons-pro/core-solid-rounded";
import { cn, extractMetadata, fetchLyrics } from "../lib/utils";
import {
    useCurrentTrackIndex,
    usePlaylist,
    usePlaylistDispatcher,
    useQueue,
} from "../hooks/useService";

interface PlaylistProps {
    playTrack: (track: Track, index: number, total: number) => Promise<void>;
    className?: string;
}

let playlistId = 0;

const PlaylistItem = React.memo(
    ({
        track,
        index,
        currentId,
        handlePlayTrack,
        handleRemoveTrack,
    }: {
        track: Track;
        index: number;
        currentId: number;
        handlePlayTrack: (index: number) => Promise<void>;
        handleRemoveTrack: (id: number) => void;
    }) => {
        return (
            <li
                className={cn(
                    "flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors",
                    track.id === currentId
                        ? "bg-gray-200 dark:bg-gray-600"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700",
                    "not-hover:[&>.btn]:!hidden text-sm sm:text-base"
                )}
                onClick={() => handlePlayTrack(index)}>
                <img src={track.coverUrl} className="size-12 mr-2 rounded-md" alt={track.name} />
                <div
                    className="flex-1 truncate flex flex-col">
                    <span className="text-[var(--text-normal)] font-semibold">{track.name}</span>
                    {track.artist && (
                        <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                            {track.artist}
                        </span>
                    )}
                </div>
                <Button
                    styleType="secondary"
                    title="Remove Track"
                    className="size-5 sm:size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                    onClick={() => handleRemoveTrack(track.id)}>
                    <HugeiconsIcon
                        icon={Cancel01Icon}
                        className="size-2 sm:size-3"
                        strokeWidth={1}
                        color="var(--text-tertiary)"
                    />
                </Button>
            </li>
        );
    }
);

const Playlist: React.FC<PlaylistProps> = ({ playTrack, className }) => {
    const playlist = usePlaylist();
    const setPlaylist = usePlaylistDispatcher();
    const current = useCurrentTrackIndex();
    const queue = useQueue();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddTrack = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const audioMap = new Map<string, File>();
            const lyricMap = new Map<string, File>();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const baseName = file.name.replace(/\.[^/.]+$/, "");
                if (file.type.startsWith("audio/")) {
                    audioMap.set(baseName, file);
                } else if (file.name.endsWith(".lrc")) {
                    lyricMap.set(baseName, file);
                }
            }

            const newTracksPromises: Promise<Track>[] = [];

            audioMap.forEach((audioFile, baseName) => {
                const lyricFile = lyricMap.get(baseName);

                const trackPromise = (async (): Promise<Track> => {
                    const lyrics = lyricFile ? await fetchLyrics(lyricFile) : [];
                    const metadata = await extractMetadata(audioFile);

                    return {
                        id: playlistId++,
                        name: metadata.title,
                        artist: metadata.performer,
                        url: URL.createObjectURL(audioFile),
                        hasLyrics: !!lyricFile,
                        lyrics,
                        codec: metadata.audioQuality,
                        coverUrl: metadata.coverData,
                    };
                })();

                newTracksPromises.push(trackPromise);
            });

            // Wait for all tracks to be processed in parallel
            const newTracks = await Promise.all(newTracksPromises);;

            setPlaylist((prev) => [...prev, ...newTracks]);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [fetchLyrics]
    );

    const handleRemoveTrack = useCallback(
        (id: number) => {
            setPlaylist((prev) => prev.filter((_) => _.id !== id));
        },
        [current]
    );

    const handlePlayTrack = useCallback(
        async (index: number) => {
            const track = playlist[index];
            const queueIndex = queue.findIndex((t) => t.id === track.id);
            await playTrack(track, queueIndex, queue.length);
        },
        [playlist, queue]
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
                        <PlaylistItem
                            key={index}
                            track={track}
                            index={index}
                            currentId={queue[current]?.id}
                            handlePlayTrack={handlePlayTrack}
                            handleRemoveTrack={handleRemoveTrack}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default React.memo(Playlist);
