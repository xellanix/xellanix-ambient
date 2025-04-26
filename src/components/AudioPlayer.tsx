import React, { useState } from "react";
import { Track, LyricLine } from "../types";

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
    playlist,
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
    isIslandExpanded,
}) => {
    const [volume, setVolume] = useState<number>(1);

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

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const newTime = parseFloat(e.target.value);
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
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
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;
    const volumePercent = volume * 100;

    return (
        <div
            className={`group relative bg-black dark:bg-gray-900 w-40 h-4 rounded-2xl overflow-hidden transition-[width,height] duration-700 ease-in-out hover:w-[90vw] hover:md:w-[800px] hover:h-48 hover:md:h-24 left-1/2 transform -translate-x-1/2`}
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
                                : "rgb(55, 65, 81)",
                        }}></div>
                    <div className="truncate">
                        <h2 className="text-white dark:text-gray-100 text-base font-semibold m-0 truncate">
                            {isTrackSelected ? queue[currentTrackIndex]?.name : "No track selected"}
                        </h2>
                        {isTrackSelected && queue[currentTrackIndex]?.artist && (
                            <p className="text-gray-400 dark:text-gray-500 text-xs m-0 truncate">
                                {queue[currentTrackIndex].artist}
                            </p>
                        )}
                    </div>
                </div>

                {/* Center: Controls and Progress */}
                <div className="flex flex-col items-center gap-3 w-full max-w-xs h-full justify-center">
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={playPrevious}
                            className="w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!canPlayPrevious}
                            title="Previous Track">
                            ◄◄
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isTrackSelected}
                            title={isPlaying ? "Pause" : "Play"}>
                            {isPlaying ? "⏸" : "▶️"}
                        </button>
                        <button
                            onClick={playNext}
                            className="w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!canPlayNext}
                            title="Next Track">
                            ►►
                        </button>
                        <button
                            onClick={toggleShuffle}
                            className={`w-5 h-5 rounded-md transition-colors ${
                                shuffle
                                    ? "bg-blue-500 dark:bg-blue-600"
                                    : "bg-gray-400 dark:bg-gray-500"
                            }`}
                            title={shuffle ? "Disable Shuffle" : "Enable Shuffle"}>
                            🔀
                        </button>
                        <button
                            onClick={toggleLoop}
                            className={`w-5 h-5 rounded-md transition-colors ${
                                loop !== "none"
                                    ? "bg-blue-500 dark:bg-blue-600"
                                    : "bg-gray-400 dark:bg-gray-500"
                            }`}
                            title={
                                loop === "none"
                                    ? "Loop Track"
                                    : loop === "track"
                                    ? "Loop Playlist"
                                    : "Disable Loop"
                            }>
                            {loop === "track" ? "🔂" : "🔁"}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full justify-center">
                        <span className="text-white dark:text-gray-100 text-[10px] w-8 text-center">
                            {formatTime(currentTime)}
                        </span>
                        <div className="bg-gray-600 dark:bg-gray-700 flex-1 h-1.5 rounded-full overflow-hidden max-w-[150px] relative">
                            <div
                                className="bg-gray-300 dark:bg-gray-400 h-full absolute left-0 top-0 z-10"
                                style={{ width: `${progressPercent}%` }}></div>
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-full bg-transparent cursor-pointer z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isTrackSelected}
                            />
                        </div>
                        <span className="text-white dark:text-gray-100 text-[10px] w-8 text-center">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Right: Volume */}
                <div className="flex items-center gap-2 flex-1 justify-end min-w-0 h-full">
                    <button
                        className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-md"
                        title="Mute/Unmute"
                        onClick={() => {
                            const newVolume = volume === 0 ? 1 : 0;
                            setVolume(newVolume);
                            if (audioRef.current) audioRef.current.volume = newVolume;
                        }}>
                        {volume === 0 ? "🔇" : "🔊"}
                    </button>
                    <div className="bg-gray-600 dark:bg-gray-700 w-20 h-1.5 rounded-full overflow-hidden relative">
                        <div
                            className="bg-gray-300 dark:bg-gray-400 h-full absolute left-0 top-0 z-10"
                            style={{ width: `${volumePercent}%` }}></div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-full bg-transparent cursor-pointer z-20"
                        />
                    </div>
                    <span className="text-white dark:text-gray-100 text-[10px] whitespace-nowrap">
                        {Math.round(volume * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
