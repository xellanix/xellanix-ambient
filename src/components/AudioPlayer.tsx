import React from "react";
import { Track } from "../types";

interface AudioPlayerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    playlist: Track[];
    currentTrackIndex: number;
    isPlaying: boolean;
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    currentTime: number;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    duration: number;
    setDuration: React.Dispatch<React.SetStateAction<number>>;
    setCurrentTrackIndex: React.Dispatch<React.SetStateAction<number>>;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioRef,
    playlist,
    currentTrackIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    setCurrentTrackIndex,
}) => {
    const togglePlay = () => {
        if (audioRef.current && currentTrackIndex >= 0) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
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

    const isTrackSelected = currentTrackIndex >= 0 && currentTrackIndex < playlist.length;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <audio
                ref={audioRef}
                src={isTrackSelected ? playlist[currentTrackIndex]?.url : undefined}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                    if (currentTrackIndex + 1 < playlist.length) {
                        setCurrentTrackIndex(currentTrackIndex + 1);
                    } else {
                        setIsPlaying(false);
                        setCurrentTrackIndex(-1);
                    }
                }}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            />
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                {isTrackSelected ? playlist[currentTrackIndex]?.name : "No track selected"}
            </h2>
            <div className="flex items-center mb-4">
                <button
                    onClick={togglePlay}
                    className="p-3 bg-blue-500 dark:bg-blue-600 text-white rounded-full mr-3 hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!isTrackSelected}>
                    {isPlaying ? "⏸" : "▶️"}
                </button>
                <div className="flex-1">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full progress-bar h-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isTrackSelected}
                        style={{ "--progress": `${(currentTime / (duration || 1)) * 100}%` } as any}
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
