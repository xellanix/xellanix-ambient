import React, { useCallback } from "react";
import { Track } from "../types";
import { useCurrentTrack } from "../hooks/useCurrentTrack";

interface QueueProps {
    queue: Track[];
    playTrack: (track: Track, index: number) => Promise<void>;
    className?: string;
}

const Queue: React.FC<QueueProps> = ({ queue, playTrack, className }) => {
    const { current } = useCurrentTrack();

    const changeTrack = useCallback(
        async (index: number) => {
            const track = queue[index];
            await playTrack(track, index);
        },
        [queue, playTrack]
    );

    const scrollToCurrentTrack = useCallback(
        (panel: HTMLDivElement) => {
            if (!panel) return;

            const element = panel.children[0].children[current] as HTMLElement;
            if (!element) return;

            let scrollTop = element.offsetTop - panel.offsetTop;

            if (current <= 0) {
                scrollTop = 0;
            } else if (current === queue.length - 1) {
                const panelHeight = panel.getBoundingClientRect().height;
                scrollTop = panel.scrollHeight - panelHeight;
            }

            panel.scrollTo({ top: scrollTop, behavior: "smooth" });
        },
        [current, queue]
    );

    return (
        <div className={className}>
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-normal)] mb-2 sm:mb-4">
                Queue
            </h2>
            <div ref={scrollToCurrentTrack} className="flex-1 overflow-auto">
                <ul className="space-y-1 sm:space-y-2">
                    {queue.map((track, index) => (
                        <li
                            key={index}
                            className={`flex items-center justify-between p-2 cursor-pointer rounded-md transition-colors ${
                                index === current
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
