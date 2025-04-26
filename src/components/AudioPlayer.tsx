import React from "react";
import { Track } from "../types";

interface AudioPlayerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
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
        if (audioRef.current) {
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

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-4">
            <audio
                ref={audioRef}
                src={playlist[currentTrackIndex]?.url}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setCurrentTrackIndex((currentTrackIndex + 1) % playlist.length)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            />
            <h2 className="text-lg font-semibold mb-2">
                {playlist[currentTrackIndex]?.name || "No track selected"}
            </h2>
            <div className="flex items-center mb-4">
                <button
                    onClick={togglePlay}
                    className="p-2 bg-blue-500 text-white rounded-full mr-2"
                    disabled={!playlist.length}>
                    {isPlaying ? "⏸" : "▶️"}
                </button>
                <div className="flex-1">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full progress-bar"
                        style={{ "--progress": `${(currentTime / (duration || 1)) * 100}%` } as any}
                    />
                    <div className="flex justify-between text-sm">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
