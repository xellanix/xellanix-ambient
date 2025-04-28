import React, { useCallback } from "react";
import { Track } from "../types";

interface QueueProps {
    queue: Track[];
    currentTrackIndex: number;
    playTrack: (track: Track, index: number) => Promise<void>;
}

const Queue: React.FC<QueueProps> = ({ queue, currentTrackIndex, playTrack }) => {
    const changeTrack = useCallback(
        async (index: number) => {
            const track = queue[index];
            await playTrack(track, index);
        },
        [queue, playTrack]
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Queue</h2>
            <ul>
                {queue.map((track, index) => (
                    <li
                        key={index}
                        className={`flex items-center justify-between p-2 cursor-pointer rounded-md transition-colors ${
                            index === currentTrackIndex
                                ? "bg-gray-200 dark:bg-gray-600"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => changeTrack(index)}>
                        <div className="flex items-center text-gray-900 dark:text-gray-200">
                            {track.hasLyrics && <span className="mr-2">🎵</span>}
                            <span>{track.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {track.codec}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default React.memo(Queue);
