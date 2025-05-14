import React, { useCallback, useEffect, useMemo } from "react";
import { useCurrentLyricIndex, useCurrentTimeDispatcher, useCurrentTrackIndex, useQueue } from "../hooks/useService";
import { useAudioRef, useLyricsRef } from "../hooks/useSharedRef";

const LyricsDisplay: React.FC = () => {
    const lyricsRef = useLyricsRef();
    const audioRef = useAudioRef();

    const currentTimeDispatcher = useCurrentTimeDispatcher();
    const currentLyricIndex = useCurrentLyricIndex();
    const currentTrackIndex = useCurrentTrackIndex();
    const queue = useQueue();

    const lyrics = useMemo(
        () =>
            currentTrackIndex >= 0 && currentTrackIndex < queue.length
                ? queue[currentTrackIndex]?.lyrics || []
                : [],
        [currentTrackIndex, queue.length]
    );

    const handleLyricClick = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            currentTimeDispatcher(time);
        }
    };

    const scrollIntoPanel = useCallback(
        (element: HTMLElement, index: number, totalLyrics: number) => {
            if (!lyricsRef.current) return;

            const panel = lyricsRef.current;
            const panelRect = panel.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const panelHeight = panelRect.height;
            const elementHeight = elementRect.height;

            let scrollTop = element.offsetTop - panel.offsetTop - (panelHeight - elementHeight) / 2;

            if (index < 0) {
                scrollTop = 0;
            } else if (index === totalLyrics - 1) {
                scrollTop = panel.scrollHeight - panelHeight;
            }

            panel.scrollTo({ top: scrollTop, behavior: "smooth" });
        },
        []
    );

    useEffect(() => {
        if (lyricsRef.current && currentLyricIndex >= 0) {
            const lyricElement = lyricsRef.current.children[currentLyricIndex + 1] as HTMLElement;
            scrollIntoPanel(lyricElement, currentLyricIndex, lyrics.length);
        }
    }, [currentLyricIndex]);

    return (
        <div
            ref={lyricsRef}
            className="opacity-0 peer-[.lyrics]:opacity-100 transition-opacity duration-700 ease-in-out p-6 rounded-lg shadow-md flex-1 gap-y-8 flex flex-col overflow-y-auto scroll-container no-scrollbar [mask-image:linear-gradient(transparent,black_40%_60%,transparent)]">
            <div className="min-h-[40dvh]" />
            {lyrics.length ? (
                lyrics.map((lyric, index) => (
                    <p
                        key={index}
                        className={`font-lyrics text-left text-5xl font-bold sm:text-3xl md:text-4xl lg:text-5xl py-1 cursor-pointer transition-all duration-300 ${
                            index === currentLyricIndex
                                ? "text-[var(--bg-accent)] opacity-100"
                                : "text-[var(--text-secondary)] opacity-10 hover:opacity-40"
                        }`}
                        onClick={() => handleLyricClick(lyric.time)}>
                        {lyric.text}
                    </p>
                ))
            ) : (
                <p className="text-center text-[var(--text-tertiary)]">No lyrics available</p>
            )}
            <div className="min-h-[40dvh]" />
        </div>
    );
};

export default React.memo(LyricsDisplay);
