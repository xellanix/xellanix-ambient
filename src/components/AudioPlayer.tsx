import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
    useSelectedTrack,
    useShuffle,
    useShuffleDispatcher,
} from "../hooks/useService";
import { useAudioRef } from "../hooks/useSharedRef";
import Tooltip from "rc-tooltip";
import { getSetting, setSetting } from "../lib/migration";

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
                "group-hover:bg-[var(--bg-primary)] duration-700 ease-in-out",
                "group-[.expanded]:bg-[var(--bg-primary)]"
            )}
            style={style}
        />
    );
};

const AudioPlayerTrack: React.FC = () => {
    const selectedTrack = useSelectedTrack();

    const coverStyle = useMemo(
        () => ({
            background: selectedTrack?.coverUrl
                ? `url(${selectedTrack.coverUrl}) center/cover`
                : "var(--bg-tertiary)",
        }),
        [selectedTrack]
    );

    return (
        <div className="flex items-center gap-3 flex-1 min-w-0 h-full">
            <div className="w-12 h-12 rounded-md shrink-0" style={coverStyle}></div>
            <div className="truncate">
                <h2 className="text-[var(--text-normal)] text-base font-semibold m-0 truncate">
                    {selectedTrack ? selectedTrack?.name : "No track selected"}
                </h2>
                {selectedTrack && selectedTrack?.artist && (
                    <p className="text-[var(--text-secondary)] text-xs m-0 truncate">
                        {selectedTrack.artist}
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
    const playButtonRef = useRef<HTMLButtonElement>(null);

    const current = useCurrentTrackIndex();
    const queue = useQueue();
    const shuffle = useShuffle();
    const setShuffle = useShuffleDispatcher();

    const toggleShuffle = useCallback(
        () =>
            setShuffle((prev) => {
                const newVal = !prev;
                setSetting("isShuffled", newVal ? "1" : "0");
                return newVal;
            }),
        []
    );

    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => {
            if (audioRef.current) {
                if (prev) {
                    audioRef.current.pause();
                    return false;
                } else {
                    audioRef.current.play().catch((err) => {
                        console.error("Playback error:", err);
                        return false;
                    });
                    return true;
                }
            }

            return prev;
        });
    }, []);

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const focusedTag = active?.tagName ?? "";
            const isTextField =
                focusedTag === "INPUT" ||
                focusedTag === "TEXTAREA" ||
                active?.getAttribute("contenteditable") === "true";

            if (isTextField) return; // Allow native behavior

            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

            switch (e.code) {
                case "KeyK": {
                    const button = playButtonRef.current;
                    if (!button) return;

                    e.preventDefault();
                    if (button.disabled) {
                        if (canPlayNext) playNext();
                    } else togglePlay();
                    break;
                }
                case "KeyS": {
                    e.preventDefault();
                    toggleShuffle();
                    break;
                }
                case "KeyL": {
                    e.preventDefault();
                    toggleLoop();
                    break;
                }
                case "KeyN": {
                    e.preventDefault();
                    if (canPlayNext) playNext();
                    break;
                }
                case "KeyP": {
                    e.preventDefault();
                    if (canPlayPrevious) playPrevious();
                    break;
                }
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canPlayNext, canPlayPrevious, playNext, playPrevious]);

    return (
        <>
            <Tooltip
                overlay={
                    <>
                        Enable/Disable Shuffle
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            S
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <Button
                    styleType={shuffle ? "accent" : "primary"}
                    onClick={toggleShuffle}
                    className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]">
                    <MemoHugeiconsIcon icon={ShuffleIcon} className="size-3" strokeWidth={1} />
                </Button>
            </Tooltip>
            <Tooltip
                overlay={
                    <>
                        Previous Track
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            P
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <Button
                    styleType="primary"
                    onClick={playPrevious}
                    className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                    disabled={!canPlayPrevious}>
                    <MemoHugeiconsIcon icon={PreviousIcon} className="size-3" strokeWidth={0} />
                </Button>
            </Tooltip>
            <Tooltip
                overlay={
                    <>
                        Play/Pause
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            K
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <Button
                    ref={playButtonRef}
                    styleType="primary"
                    onClick={togglePlay}
                    className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                    disabled={!isTrackSelected}
                    tabIndex={0}>
                    <MemoHugeiconsIcon
                        icon={PlayIcon}
                        altIcon={PauseIcon}
                        showAlt={isPlaying}
                        className="size-3"
                        strokeWidth={0}
                    />
                </Button>
            </Tooltip>
            <Tooltip
                overlay={
                    <>
                        Next Track
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            N
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <Button
                    styleType="primary"
                    onClick={playNext}
                    className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]"
                    disabled={!canPlayNext}>
                    <MemoHugeiconsIcon icon={NextIcon} className="size-3" strokeWidth={0} />
                </Button>
            </Tooltip>
            <Tooltip
                overlay={
                    <>
                        Loop Track/Playlist/None
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            L
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <Button
                    styleType={loop !== "none" ? "accent" : "primary"}
                    onClick={toggleLoop}
                    className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]">
                    <MemoHugeiconsIcon
                        icon={RepeatIcon}
                        altIcon={RepeatOne01Icon}
                        showAlt={loop === "track"}
                        className="size-3"
                        strokeWidth={1}
                    />
                </Button>
            </Tooltip>
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

const getIsMuted = () => parseInt(getSetting("isMuted") || "0") === 1;
const rv = (volume: number) => Math.max(0, Math.min(100, Math.round(volume)));
const getStoredVolume = () => (getIsMuted() ? 0 : rv(parseInt(getSetting("volume") || "100")));
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
        const clampedVolume = rv(newVolume);
        setSetting("isMuted", clampedVolume !== 0 ? "0" : "1");
        setSetting("volume", clampedVolume === 0 ? "100" : clampedVolume.toString());
        setVolume(clampedVolume);
        if (audioRef.current) {
            audioRef.current.volume = clampedVolume / 100;
        }
    }, []);

    const handleMute = useCallback(() => {
        setVolume((prev) => {
            const isSoundOn = prev !== 0;
            setSetting("isMuted", isSoundOn ? "1" : "0");
            const newVolume = getStoredVolume();
            if (audioRef.current) audioRef.current.volume = newVolume / 100;

            return newVolume;
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const focusedTag = active?.tagName ?? "";
            const isTextField =
                focusedTag === "INPUT" ||
                focusedTag === "TEXTAREA" ||
                active?.getAttribute("contenteditable") === "true";

            if (isTextField) return; // Allow native behavior

            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

            switch (e.code) {
                case "KeyM": {
                    e.preventDefault();
                    handleMute();
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
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0 h-full not-md:w-full not-md:max-w-56">
            <Tooltip
                overlay={
                    <>
                        {volume === 0 ? "Unmute" : "Mute"}
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            M
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <Button
                    styleType="secondary"
                    onClick={handleMute}
                    className="size-6 [--button-p:0] [--button-depth:-0.125rem] [--button-depth-jump:-0.25rem] [--button-depth-shrink:-0.1rem]">
                    <MemoHugeiconsIcon
                        icon={VolumeHighIcon}
                        altIcon={VolumeOffIcon}
                        showAlt={volume === 0}
                        className="size-3"
                        strokeWidth={0}
                    />
                </Button>
            </Tooltip>
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
                "hover:bg-[var(--bg-primary)] hover:w-[calc(100vw-theme(spacing.4)*2)] hover:h-48 hover:md:h-24",
                "[&.expanded]:bg-[var(--bg-primary)] [&.expanded]:w-[calc(100vw-theme(spacing.4)*2)] [&.expanded]:h-48 [&.expanded]:md:h-24"
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
                className={`opacity-0 group-hover:opacity-100 group-[.expanded]:opacity-100 transition-opacity duration-500 ease-in-out w-full h-full p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none group-hover:pointer-events-auto group-[.expanded]:pointer-events-auto`}>
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
