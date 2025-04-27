import React, { useState } from "react";
import { Track, LyricLine } from "../types";
import Slider, { SliderInput, useSlider } from "./Slider/Slider";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    MuteIcon,
    NextIcon,
    PauseIcon,
    PlayIcon,
    PreviousIcon,
    RepeatIcon,
    RepeatOne01Icon,
    ShuffleIcon,
    VolumeHighIcon,
    VolumeMute02Icon,
    VolumeOffIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { Button } from "./Button/Button";

interface AudioPlayerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playlist: Track[];
    queue: Track[];
    currentTrackIndex: number;
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    currentTime: number;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    duration: number;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>;
    setLyrics: React.Dispatch<React.SetStateAction<LyricLine[]>>;
    setCurrentLyricIndex: React.Dispatch<React.SetStateAction<number>>;
    shuffle: boolean;
    loop: "none" | "track" | "playlist";
    toggleShuffle: () => void;
    toggleLoop: () => void;
    isIslandExpanded: boolean;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

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

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioRef,
    queue,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    setCurrentTrackIndex,
    setLyrics,
    setCurrentLyricIndex,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
}) => {
    const [volume, setVolume] = useState<number>(100);
    const scaleSliderInputRef = useSlider();
    const volumeSliderInputRef = useSlider();

    const togglePlay = () => {
        if (audioRef.current && currentTrackIndex >= 0) {
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
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (newTime: number) => {
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const handleVolumeChange = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(100, newVolume));
        setVolume(clampedVolume);
        if (audioRef.current) {
            audioRef.current.volume = clampedVolume / 100;
        }
    };

    const playTrack = async (index: number) => {
        if (index < 0 || index >= queue.length || !audioRef.current) {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setLyrics([]);
            setCurrentLyricIndex(-1);
            return;
        }

        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setLyrics([]);
        setCurrentLyricIndex(-1);

        const track = queue[index];
        if (track.hasLyrics && track.lyricsUrl) {
            try {
                const response = await fetch(track.lyricsUrl);
                const content = await response.text();
                setLyrics(parseLrc(content));
            } catch (err) {
                console.error("Failed to load lyrics:", err);
                setLyrics([]);
            }
        }

        audioRef.current.src = track.url;
        try {
            await audioRef.current.load();
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("Playback error:", err);
            setIsPlaying(false);
            setTimeout(async () => {
                try {
                    await audioRef.current?.play();
                    setIsPlaying(true);
                } catch (retryErr) {
                    console.error("Retry playback error:", retryErr);
                    setIsPlaying(false);
                }
            }, 100);
        }
    };

    const playPrevious = () => {
        if (currentTrackIndex > 0) {
            playTrack(currentTrackIndex - 1);
        } else if (loop === "playlist" && queue.length > 0) {
            playTrack(queue.length - 1);
        }
    };

    const playNext = () => {
        if (currentTrackIndex + 1 < queue.length) {
            playTrack(currentTrackIndex + 1);
        } else if (loop === "playlist" && queue.length > 0) {
            playTrack(0);
        } else {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setLyrics([]);
            setCurrentLyricIndex(-1);
        }
    };

    const handleEnded = async () => {
        if (loop === "track" && currentTrackIndex >= 0) {
            await playTrack(currentTrackIndex);
        } else if (currentTrackIndex + 1 < queue.length) {
            await playTrack(currentTrackIndex + 1);
        } else if (loop === "playlist" && queue.length > 0) {
            await playTrack(0);
        } else {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setLyrics([]);
            setCurrentLyricIndex(-1);
        }
    };

    const isTrackSelected = currentTrackIndex >= 0 && currentTrackIndex < queue.length;
    const canPlayPrevious = currentTrackIndex > 0 || (loop === "playlist" && queue.length > 0);
    const canPlayNext =
        currentTrackIndex + 1 < queue.length || (loop === "playlist" && queue.length > 0);

    return (
        <div
            className={`group relative bg-[var(--bg-tertiary)] shadow-md w-40 h-4 rounded-2xl overflow-hidden transition-[width,height,background] duration-700 ease-in-out hover:w-[90vw] hover:md:w-[800px] hover:h-48 hover:md:h-24 hover:bg-[var(--bg-primary)] left-1/2 transform -translate-x-1/2`}
            style={{ transformOrigin: "center bottom" }}>
            <audio
                ref={audioRef}
                src={isTrackSelected ? queue[currentTrackIndex]?.url : undefined}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            />
            <div
                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out w-full h-full p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none group-hover:pointer-events-auto`}>
                {/* Left: Song Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0 h-full">
                    <div
                        className="w-12 h-12 rounded-xl shrink-0"
                        style={{
                            background: queue[currentTrackIndex]?.coverUrl
                                ? `url(${queue[currentTrackIndex].coverUrl}) center/cover`
                                : "var(--bg-tertiary)",
                        }}></div>
                    <div className="truncate">
                        <h2 className="text-[var(--text-normal)] text-base font-semibold m-0 truncate">
                            {isTrackSelected ? queue[currentTrackIndex]?.name : "No track selected"}
                        </h2>
                        {isTrackSelected && queue[currentTrackIndex]?.artist && (
                            <p className="text-[var(--text-secondary)] text-xs m-0 truncate">
                                {queue[currentTrackIndex].artist}
                            </p>
                        )}
                    </div>
                </div>

                {/* Center: Controls and Progress */}
                <div className="flex flex-col items-center gap-3 w-full max-w-xs h-full justify-center">
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
                            <HugeiconsIcon icon={ShuffleIcon} className="size-3" strokeWidth={0} />
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
                                strokeWidth={0}
                            />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 w-full justify-center">
                        <span className="text-[var(--text-normal)] text-xs w-8 text-center">
                            {formatTime(currentTime)}
                        </span>
                        <Slider
                            sliderInputRef={scaleSliderInputRef}
                            className="flex-1 max-w-[150px]"
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

                {/* Right: Volume */}
                <div className="flex items-center gap-2 flex-1 justify-end min-w-0 h-full">
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
                        className="flex-1"
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

export default AudioPlayer;
