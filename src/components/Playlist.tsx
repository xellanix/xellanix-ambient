import React, { useRef, useCallback, useEffect } from "react";
import { Track } from "../types";
import { Button } from "./Button/Button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Cancel01Icon } from "@hugeicons-pro/core-solid-rounded";
import { cn, extractMetadata, fetchLyrics } from "../lib/utils";
import {
    useCurrentTrackIndex,
    useHandlePlay,
    usePlaylist,
    usePlaylistDispatcher,
    useQueue,
    useQueueDispatcher,
} from "../hooks/useService";
import Tooltip from "rc-tooltip";

interface PlaylistProps {
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
        handleRemoveTrack: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, id: number) => void;
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
                <div className="flex-1 truncate flex flex-col">
                    <span className="text-[var(--text-normal)] font-semibold">{track.name}</span>
                    {track.artist && (
                        <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                            {track.artist}
                        </span>
                    )}
                </div>
                <Tooltip
                    overlay="Remove Track"
                    classNames={{
                        root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                        body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none",
                    }}
                    showArrow={false}
                    mouseEnterDelay={0.5}
                    align={{ offset: [-16, 0] }}
                    placement="left">
                    <Button
                        styleType="secondary"
                        className="size-5 sm:size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                        onClick={(e) => handleRemoveTrack(e, track.id)}>
                        <HugeiconsIcon
                            icon={Cancel01Icon}
                            className="size-2 sm:size-3"
                            strokeWidth={1}
                            color="var(--text-tertiary)"
                        />
                    </Button>
                </Tooltip>
            </li>
        );
    }
);

const Playlist: React.FC<PlaylistProps> = ({ className }) => {
    const playlist = usePlaylist();
    const setPlaylist = usePlaylistDispatcher();
    const setQueue = useQueueDispatcher();
    const current = useCurrentTrackIndex();
    const queue = useQueue();
    const handlePlay = useHandlePlay();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddTrack = useCallback(() => fileInputRef.current?.click(), []);

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

            audioMap.forEach(async (audioFile, baseName) => {
                const lyricFile = lyricMap.get(baseName);
                const id = playlistId++;
                const url = URL.createObjectURL(audioFile);

                const lyrics = lyricFile ? await fetchLyrics(lyricFile) : [];

                // Add placeholder track first
                const placeholderTrack: Track = {
                    id,
                    name: audioFile.name,
                    artist: "",
                    url,
                    hasLyrics: !!lyricFile,
                    lyrics,
                    codec: "",
                    coverUrl: "./cover.svg", // or a default cover
                };

                setPlaylist((prev) => [...prev, placeholderTrack]);

                // Fetch lyrics and metadata asynchronously
                (async () => {
                    const [metadata] = await Promise.all([extractMetadata(audioFile)]);

                    setPlaylist((prev) =>
                        prev.map((t) =>
                            t.id === id
                                ? {
                                      ...t,
                                      name: metadata.title || t.name,
                                      artist: metadata.performer || "",
                                      codec: metadata.audioQuality,
                                      coverUrl: metadata.coverData || "",
                                  }
                                : t
                        )
                    );
                    setQueue((prev) =>
                        prev.map((t) =>
                            t.id === id
                                ? {
                                      ...t,
                                      name: metadata.title || t.name,
                                      artist: metadata.performer || "",
                                      codec: metadata.audioQuality,
                                      coverUrl: metadata.coverData || "",
                                  }
                                : t
                        )
                    );
                })();
            });

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [fetchLyrics, setPlaylist]
    );

    const handleRemoveTrack = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, trackId: number) => {
            e.stopPropagation();
            setPlaylist((prev) => prev.filter(({ id }) => id !== trackId));
        },
        [current]
    );

    const handlePlayTrack = useCallback(
        async (index: number) => {
            const track = playlist[index];
            const queueIndex = queue.findIndex((t) => t.id === track.id);
            await handlePlay(queueIndex);
        },
        [playlist, queue, handlePlay]
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const focusedTag = active?.tagName ?? "";
            const isTextField =
                focusedTag === "INPUT" ||
                focusedTag === "TEXTAREA" ||
                active?.getAttribute("contenteditable") === "true";

            if (isTextField) return; // Allow native behavior

            switch (e.code) {
                case "KeyA": {
                    e.preventDefault();
                    handleAddTrack();
                    break;
                }
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className={className}>
            <div className="flex flex-row mb-2 sm:mb-4 items-center">
                <h2 className="flex-1 text-lg sm:text-xl font-semibold text-[var(--text-normal)]">
                    Playlist
                </h2>
                <div>
                    <Tooltip
                        overlay={
                            <>
                                Add Track
                                <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                    A
                                </div>
                            </>
                        }
                        classNames={{
                            root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                            body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                        }}
                        showArrow={false}
                        mouseEnterDelay={0.5}
                        align={{ offset: [-16, 0] }}
                        placement="left">
                        <Button
                            styleType="accent"
                            onClick={handleAddTrack}
                            className="w-8 h-7.5 [--button-p:theme(padding.2)]">
                            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={0} />
                        </Button>
                    </Tooltip>
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
