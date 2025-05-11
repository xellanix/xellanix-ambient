import React, { useState, useCallback, useMemo, useEffect } from "react";
import Slider, { SliderInput, useSlider } from "./Slider/Slider";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
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
import {
    useCurrentTime,
    useCurrentTimeDispatcher,
    useCurrentTrackIndex,
    useQueue,
    useShuffle,
    useShuffleDispatcher,
} from "../hooks/useService";
import { useAudioRef } from "../hooks/useSharedRef";

interface MemoHugeiconsIconProps {
    icon: IconSvgElement;
    altIcon?: IconSvgElement;
    strokeWidth?: number;
    className: string;
    showAlt?: boolean;
}
const MemoHugeiconsIcon = React.memo(({ ...props }: MemoHugeiconsIconProps) => {
    return <HugeiconsIcon {...props} />;
});

interface AudioPlayerProps {
    loadedMetadata: () => void;
    handleTimeUpdate: () => void;
    handleEnded: () => Promise<void>;
    islandComp: React.ReactNode;
    trackComp: React.ReactNode;
    controllerComp: React.ReactNode;
    timelineComp: React.ReactNode;
    volumeComp: React.ReactNode;
}

interface AudioPlayerControllerProps {
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    loop: "none" | "track" | "playlist";
    toggleLoop: () => void;
    handlePlay: (newIndex: number) => Promise<void>;
    playNext: () => Promise<void>;
}

interface AudioPlayerTimelineProps {
    duration: number;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const AudioPlayerIsland: React.FC<{ duration: number }> = ({ duration }) => {
    const currentTime = useCurrentTime();

    const style = useMemo(
        () => ({
            width: `${(Math.max(0, Math.min(currentTime / (duration || 1), 1)) * 100).toFixed(2)}%`,
        }),
        [currentTime, duration]
    );

    return (
        <div
            className={cn(
                "absolute inset-0 bg-[var(--bg-accent)] transition-colors -z-50 rounded-2xl",
                "group-hover:bg-[var(--bg-primary)] duration-700 ease-in-out"
            )}
            style={style}
        />
    );
};

const AudioPlayerTrack: React.FC = () => {
    const current = useCurrentTrackIndex();
    const queue = useQueue();

    const isTrackSelected = useMemo(
        () => current >= 0 && current < queue.length,
        [current, queue.length]
    );

    const coverStyle = useMemo(
        () => ({
            background: queue[current]?.coverUrl
                ? `url(${queue[current].coverUrl}) center/cover`
                : "var(--bg-tertiary)",
        }),
        [current, queue]
    );

    return (
        <div className="flex items-center gap-3 flex-1 min-w-0 h-full">
            <div className="w-12 h-12 rounded-xl shrink-0" style={coverStyle}></div>
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
    );
};

const AudioPlayerController: React.FC<AudioPlayerControllerProps> = ({
    isPlaying,
    setIsPlaying,
    loop,
    toggleLoop,
    handlePlay,
    playNext,
}) => {
    const audioRef = useAudioRef();

    const current = useCurrentTrackIndex();
    const queue = useQueue();
    const shuffle = useShuffle();
    const setShuffle = useShuffleDispatcher();

    const toggleShuffle = useCallback(
        () =>
            setShuffle((prev) => {
                const newVal = !prev;
                window.localStorage.setItem("isShuffled", newVal ? "1" : "0");
                return newVal;
            }),
        []
    );

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
    }, [current, isPlaying]);

    const playPrevious = useCallback(async () => {
        if (current > 0) await handlePlay(current - 1);
        else if (loop === "playlist" && queue.length > 0) await handlePlay(queue.length - 1);
    }, [current, loop, queue.length]);

    const isTrackSelected = useMemo(
        () => current >= 0 && current < queue.length,
        [current, queue.length]
    );
    const canPlayPrevious = useMemo(
        () => current > 0 || (loop === "playlist" && queue.length > 0),
        [current, loop, queue.length]
    );
    const canPlayNext = useMemo(
        () => current + 1 < queue.length || (loop === "playlist" && queue.length > 0),
        [current, loop, queue.length]
    );

    return (
        <>
            <Button
                styleType="primary"
                onClick={playPrevious}
                className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                disabled={!canPlayPrevious}
                title="Previous Track">
                <MemoHugeiconsIcon icon={PreviousIcon} className="size-3" strokeWidth={0} />
            </Button>
            <Button
                styleType="primary"
                onClick={togglePlay}
                className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                disabled={!isTrackSelected}
                title={isPlaying ? "Pause" : "Play"}>
                <MemoHugeiconsIcon
                    icon={PlayIcon}
                    altIcon={PauseIcon}
                    showAlt={isPlaying}
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
                <MemoHugeiconsIcon icon={NextIcon} className="size-3" strokeWidth={0} />
            </Button>
            <Button
                styleType={shuffle ? "accent" : "primary"}
                onClick={toggleShuffle}
                className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                title={shuffle ? "Disable Shuffle" : "Enable Shuffle"}>
                <MemoHugeiconsIcon icon={ShuffleIcon} className="size-3" strokeWidth={1} />
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
                <MemoHugeiconsIcon
                    icon={RepeatIcon}
                    altIcon={RepeatOne01Icon}
                    showAlt={loop === "track"}
                    className="size-3"
                    strokeWidth={1}
                />
            </Button>
        </>
    );
};

const AudioPlayerTimeline: React.FC<AudioPlayerTimelineProps> = ({ duration }) => {
    const audioRef = useAudioRef();

    const currentTime = useCurrentTime();
    const setCurrentTime = useCurrentTimeDispatcher();

    const handleSeek = useCallback(
        (newTime: number) => {
            setCurrentTime(newTime);
            if (audioRef.current) {
                audioRef.current.currentTime = newTime;
            }
        },
        [audioRef, setCurrentTime]
    );

    return (
        <div className="flex items-center gap-2 w-full justify-center">
            <span className="text-[var(--text-normal)] text-xs w-8 text-center">
                {formatTime(currentTime)}
            </span>
            <Slider
                className="flex-1 max-w-xs"
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
    );
};

const getIsMuted = () => parseInt(window.localStorage.getItem("isMuted") || "0") === 1;
const getStoredVolume = () =>
    getIsMuted() ? 0 : parseInt(window.localStorage.getItem("volume") || "100");
const AudioPlayerVolume: React.FC = () => {
    const audioRef = useAudioRef();
    const volumeSliderInputRef = useSlider();

    const [volume, setVolume] = useState<number>(getStoredVolume);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(100, newVolume));
        window.localStorage.setItem("volume", clampedVolume.toString());
        setVolume(clampedVolume);
        if (audioRef.current) {
            audioRef.current.volume = clampedVolume / 100;
        }
    }, []);

    const handleMute = useCallback(() => {
        const isSoundOn = volume !== 0;
        window.localStorage.setItem("isMuted", isSoundOn ? "1" : "0");
        const newVolume = getStoredVolume();
        setVolume(newVolume);
        if (audioRef.current) audioRef.current.volume = newVolume / 100;
    }, [volume]);

    return (
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0 h-full not-md:w-full not-md:max-w-56">
            <Button
                styleType="secondary"
                onClick={handleMute}
                className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                title={volume === 0 ? "Unmute" : "Mute"}>
                <MemoHugeiconsIcon
                    icon={VolumeHighIcon}
                    altIcon={VolumeOffIcon}
                    showAlt={volume === 0}
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
                <span className="absolute right-0 text-xs text-[var(--text-normal)] pr-1">%</span>
            </div>
        </div>
    );
};

export const AudioPlayerIslandMemo = React.memo(AudioPlayerIsland);
export const AudioPlayerTrackMemo = React.memo(AudioPlayerTrack);
export const AudioPlayerControllerMemo = React.memo(AudioPlayerController);
export const AudioPlayerTimelineMemo = React.memo(AudioPlayerTimeline);
export const AudioPlayerVolumeMemo = React.memo(AudioPlayerVolume);

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    loadedMetadata,
    handleTimeUpdate,
    handleEnded,
    islandComp,
    trackComp,
    controllerComp,
    timelineComp,
    volumeComp,
}) => {
    const audioRef = useAudioRef();

    return (
        <div
            className={cn(
                `group audio-player relative shadow-md w-40 h-4 rounded-2xl overflow-hidden left-1/2 transform -translate-x-1/2`,
                "bg-[var(--bg-tertiary)]",
                "transition-[width,height,background] duration-700 ease-in-out",
                "hover:bg-[var(--bg-primary)] hover:w-[calc(100vw-theme(spacing.4)*2)] hover:h-48 hover:md:h-24"
            )}
            style={{ transformOrigin: "center bottom" }}>
            {islandComp}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={loadedMetadata}
            />
            <div
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out w-full h-full p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none group-hover:pointer-events-auto`}>
                {trackComp}

                <div className="flex flex-col items-center gap-3 w-[80%] md:w-[40%] max-w-md h-full justify-center">
                    <div className="flex gap-2 justify-center">{controllerComp}</div>
                    {timelineComp}
                </div>

                {volumeComp}
            </div>
        </div>
    );
};

const AudioPlayerMemo = React.memo(AudioPlayer);

export default AudioPlayerMemo;
