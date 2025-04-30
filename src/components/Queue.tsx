import React, { useCallback } from "react";
import { Track } from "../types";

interface QueueProps {
    queue: Track[];
    currentTrackIndex: number;
    playTrack: (track: Track, index: number) => Promise<void>;
    className?: string;
}

const Queue: React.FC<QueueProps> = ({ queue, currentTrackIndex, playTrack, className }) => {
    const changeTrack = useCallback(
        async (index: number) => {
            const track = queue[index];
            await playTrack(track, index);
        },
        [queue, playTrack]
    );

    return (
        <div className={className}>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-normal)] mb-2 sm:mb-4">
                Queue
            </h2>
            <div className="flex-1 overflow-auto">
                <ul className="space-y-1 sm:space-y-2">
                    {queue.map((track, index) => (
                        <li
                            key={index}
                            className={`flex items-center justify-between p-2 cursor-pointer rounded-md transition-colors ${
                                index === currentTrackIndex
                                    ? "bg-gray-200 dark:bg-gray-600"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            } text-sm sm:text-base`}
                            onClick={() => changeTrack(index)}>
                            <div className="flex items-center text-[var(--text-normal)]">
                                {track.hasLyrics && <span className="mr-1 sm:mr-2">🎵</span>}
                                <span>{track.name}</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <span className="text-xs sm:text-sm text-[var(--text-tertiary)]">
                                    {track.codec}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default React.memo(Queue);
