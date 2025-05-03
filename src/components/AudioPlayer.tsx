import React, { useState, useCallback } from "react";
import { Track } from "../types";
import Slider, { SliderInput, useSlider } from "./Slider/Slider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    NextIcon,
    PauseIcon,
    PlayIcon,
    PreviousIcon,
    RepeatIcon,
    RepeatOne01Icon,
    ShuffleIcon,
    VolumeHighIcon,
    VolumeOffIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { Button } from "./Button/Button";
import { cn } from "../lib/utils";
import { useCurrentTrack } from "../hooks/useCurrentTrack";

interface AudioPlayerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    queue: Track[];
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    currentTime: number;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    duration: number;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    shuffle: boolean;
    loop: "none" | "track" | "playlist";
    toggleShuffle: () => void;
    toggleLoop: () => void;
    isIslandExpanded: boolean;
    playTrack: (track: Track, index: number) => Promise<void>;
    resetState: () => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioRef,
    queue,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
    playTrack,
    resetState,
}) => {
    const { current, dispatch } = useCurrentTrack();

    const [volume, setVolume] = useState<number>(100);
    const scaleSliderInputRef = useSlider();
    const volumeSliderInputRef = useSlider();

    const togglePlay = useCallback(() => {
        if (audioRef.current && current >= 0) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().catch((err) => {
                    console.error("Playback error:", err);
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        }
    }, [audioRef, current, isPlaying, setIsPlaying]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    }, [audioRef, setCurrentTime, setDuration]);

    const handleSeek = useCallback(
        (newTime: number) => {
            setCurrentTime(newTime);
            if (audioRef.current) {
                audioRef.current.currentTime = newTime;
            }
        },
        [audioRef, setCurrentTime]
    );

    const handleVolumeChange = useCallback(
        (newVolume: number) => {
            const clampedVolume = Math.max(0, Math.min(100, newVolume));
            setVolume(clampedVolume);
            if (audioRef.current) {
                audioRef.current.volume = clampedVolume / 100;
            }
        },
        [audioRef]
    );

    const handlePlay = useCallback(
        async (newIndex: number) => {
            dispatch(newIndex);
            const track = queue[newIndex];
            await playTrack(track, newIndex);
        },
        [dispatch, queue, playTrack]
    );

    const playPrevious = useCallback(async () => {
        if (current > 0) await handlePlay(current - 1);
        else if (loop === "playlist" && queue.length > 0) await handlePlay(queue.length - 1);
    }, [current, loop, queue, handlePlay]);

    const playNext = useCallback(async () => {
        if (current + 1 < queue.length) await handlePlay(current + 1);
        else if (loop === "playlist" && queue.length > 0) await handlePlay(0);
        else resetState();
    }, [current, loop, queue, handlePlay, resetState]);

    const handleEnded = useCallback(async () => {
        if (loop === "track" && current >= 0) await handlePlay(current);
        else await playNext();
    }, [current, loop, handlePlay]);

    const isTrackSelected = current >= 0 && current < queue.length;
    const canPlayPrevious = current > 0 || (loop === "playlist" && queue.length > 0);
    const canPlayNext = current + 1 < queue.length || (loop === "playlist" && queue.length > 0);

    return (
        <div
            className={cn(
                `group audio-player relative shadow-md w-40 h-4 rounded-2xl overflow-hidden left-1/2 transform -translate-x-1/2`,
                "bg-[var(--bg-tertiary)]",
                "transition-[width,height,background] duration-700 ease-in-out",
                "hover:bg-[var(--bg-primary)] hover:w-[calc(100vw-theme(spacing.4)*2)] hover:h-48 hover:md:h-24"
            )}
            style={{ transformOrigin: "center bottom" }}>
            <div
                className={cn(
                    "absolute inset-0 bg-[var(--bg-accent)] transition-colors -z-50 rounded-2xl",
                    "group-hover:bg-[var(--bg-primary)] duration-700 ease-in-out"
                )}
                style={{
                    width: `${(
                        Math.max(0, Math.min(currentTime / (duration || 1), 1)) * 100
                    ).toFixed(2)}%`,
                }}
            />
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            />
            <div
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out w-full h-full p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none group-hover:pointer-events-auto`}>
                <div className="flex items-center gap-3 flex-1 min-w-0 h-full">
                    <div
                        className="w-12 h-12 rounded-xl shrink-0"
                        style={{
                            background: queue[current]?.coverUrl
                                ? `url(${queue[current].coverUrl}) center/cover`
                                : "var(--bg-tertiary)",
                        }}></div>
                    <div className="truncate">
                        <h2 className="text-[var(--text-normal)] text-base font-semibold m-0 truncate">
                            {isTrackSelected ? queue[current]?.name : "No track selected"}
                        </h2>
                        {isTrackSelected && queue[current]?.artist && (
                            <p className="text-[var(--text-secondary)] text-xs m-0 truncate">
                                {queue[current].artist}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3 w-[40%] max-w-xs h-full justify-center">
                    <div className="flex gap-2 justify-center">
                        <Button
                            styleType="primary"
                            onClick={playPrevious}
                            className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                            disabled={!canPlayPrevious}
                            title="Previous Track">
                            <HugeiconsIcon icon={PreviousIcon} className="size-3" strokeWidth={0} />
                        </Button>
                        <Button
                            styleType="primary"
                            onClick={togglePlay}
                            className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                            disabled={!isTrackSelected}
                            title={isPlaying ? "Pause" : "Play"}>
                            <HugeiconsIcon
                                icon={isPlaying ? PauseIcon : PlayIcon}
                                className="size-3"
                                strokeWidth={0}
                            />
                        </Button>
                        <Button
                            styleType="primary"
                            onClick={playNext}
                            className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                            disabled={!canPlayNext}
                            title="Next Track">
                            <HugeiconsIcon icon={NextIcon} className="size-3" strokeWidth={0} />
                        </Button>
                        <Button
                            styleType={shuffle ? "accent" : "primary"}
                            onClick={toggleShuffle}
                            className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                            title={shuffle ? "Disable Shuffle" : "Enable Shuffle"}>
                            <HugeiconsIcon icon={ShuffleIcon} className="size-3" strokeWidth={1} />
                        </Button>
                        <Button
                            styleType={loop !== "none" ? "accent" : "primary"}
                            onClick={toggleLoop}
                            className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                            title={
                                loop === "none"
                                    ? "Loop Track"
                                    : loop === "track"
                                    ? "Loop Playlist"
                                    : "Disable Loop"
                            }>
                            <HugeiconsIcon
                                icon={loop === "track" ? RepeatOne01Icon : RepeatIcon}
                                className="size-3"
                                strokeWidth={1}
                            />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 w-full justify-center">
                        <span className="text-[var(--text-normal)] text-xs w-8 text-center">
                            {formatTime(currentTime)}
                        </span>
                        <Slider
                            sliderInputRef={scaleSliderInputRef}
                            className="flex-1 max-w-[225px]"
                            min={0}
                            max={duration || 100}
                            defaultValue={currentTime}
                            step={1}
                            onChange={handleSeek}
                        />
                        <span className="text-[var(--text-normal)] text-xs w-8 text-center">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end min-w-0 h-full not-md:w-full not-md:max-w-56">
                    <Button
                        styleType="secondary"
                        onClick={() => {
                            const newVolume = volume === 0 ? 100 : 0;
                            setVolume(newVolume);
                            if (audioRef.current) audioRef.current.volume = newVolume / 100;
                        }}
                        className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                        title={volume === 0 ? "Unmute" : "Mute"}>
                        <HugeiconsIcon
                            icon={volume === 0 ? VolumeOffIcon : VolumeHighIcon}
                            className="size-3"
                            strokeWidth={0}
                        />
                    </Button>
                    <Slider
                        sliderInputRef={volumeSliderInputRef}
                        className="flex-1 max-w-32"
                        min={0}
                        max={100}
                        defaultValue={volume}
                        step={1}
                        onChange={handleVolumeChange}
                    />
                    <div className="relative items-center flex">
                        <SliderInput
                            sliderInputRef={volumeSliderInputRef}
                            className="text-xs w-9"
                            defaultValue={volume}
                        />
                        <span className="absolute right-0 text-xs text-[var(--text-normal)] pr-1">
                            %
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(AudioPlayer);
