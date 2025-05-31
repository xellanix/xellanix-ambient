import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    AudioPlayerControllerMemo,
    AudioPlayerIslandMemo,
    AudioPlayerTimelineMemo,
    AudioPlayerTrackMemo,
    AudioPlayerVolumeMemo,
} from "./components/AudioPlayer";
import LyricsDisplay from "./components/LyricsDisplay";
import { Track } from "./types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowShrink02Icon, FullScreenIcon } from "@hugeicons-pro/core-solid-rounded";
import { SidebarMemo } from "./components/Sidebar";
import { Button } from "./components/Button/Button";
import {
    PlaylistProvider,
    SelectedTrackProvider,
    ServiceProvider,
    useCurrentLyricIndexDispatcher,
    useCurrentTimeDispatcher,
    useCurrentTrackIndex,
    useCurrentTrackIndexDispatcher,
    useQueue,
} from "./hooks/useService";
import AudioPlayerMemo from "./components/AudioPlayer";
import { SharedRefProvider, useAudioRef, useGlanceRef, useLyricsRef } from "./hooks/useSharedRef";
import { TrackGlance } from "./components/TrackGlance";
import Tooltip from "rc-tooltip";
import { getSetting, setSetting } from "./lib/migration";

const getLoopMode = () => (getSetting("loopMode") || "none") as "none" | "track" | "playlist";

const MaximizeLyricsButton = React.memo(
    ({ isMaximized, onClick }: { isMaximized: boolean; onClick: () => void }) => (
        <div className="absolute z-50 right-0">
            <Tooltip
                overlay={
                    <>
                        {isMaximized ? "Restore Lyrics" : "Maximize Lyrics"}
                        <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                            F
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                align={{ offset: [-16, 0] }}
                placement="left">
                <Button
                    styleType="secondary"
                    className="w-10 h-9.5 [--button-p:theme(padding.2)] opacity-0 group-hover:animate-[show-maximize_4s] hover:!opacity-100 focus-visible:!opacity-100"
                    onClick={onClick}>
                    <HugeiconsIcon
                        icon={FullScreenIcon}
                        altIcon={ArrowShrink02Icon}
                        showAlt={isMaximized}
                        className="size-6"
                        strokeWidth={0}
                        opacity={0.5}
                    />
                </Button>
            </Tooltip>
        </div>
    )
);

const AppContent = React.memo(({ playTrack }: { playTrack: any }) => {
    const [maximizeLyrics, setMaximizeLyrics] = useState<boolean>(false);

    const toggleMaximizeLyrics = useCallback(() => setMaximizeLyrics((prev) => !prev), []);

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
                case "KeyF": {
                    e.preventDefault();
                    toggleMaximizeLyrics();
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
        <div className="flex flex-col sm:flex-row gap-4 sm:flex-1 sm:overflow-hidden max-h-full">
            <div className="@container/main flex flex-col flex-1 relative group overflow-auto sm:h-full max-h-full">
                <TrackGlance />
                <div className="@container absolute size-full flex justify-center items-center peer-[.lyrics-bg]:opacity-0">
                    <div className="flex items-center gap-2">
                        <img
                            src="./icon-sq.svg"
                            alt="Xellanix icon"
                            className="@sm:size-12 size-10"
                        />
                        <h1 className="text-2xl @sm:text-4xl font-bold text-[var(--text-normal)]">
                            Ambient
                        </h1>
                    </div>
                </div>
                <MaximizeLyricsButton isMaximized={maximizeLyrics} onClick={toggleMaximizeLyrics} />
                <LyricsDisplay />
            </div>

            {!maximizeLyrics && <SidebarMemo playTrack={playTrack} />}
        </div>
    );
});

const AppService: React.FC = () => {
    const lyricsRef = useLyricsRef();

    const queue = useQueue();
    const currentTrackIndex = useCurrentTrackIndex();
    const setCurrentTrackIndex = useCurrentTrackIndexDispatcher();
    const setCurrentTime = useCurrentTimeDispatcher();
    const setCurrentLyricIndex = useCurrentLyricIndexDispatcher();
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [loop, setLoop] = useState<"none" | "track" | "playlist">(getLoopMode);
    const audioRef = useAudioRef();
    const glanceRef = useGlanceRef();
    const rootRef = useRef<HTMLDivElement>(null);

    const toggleLoop = useCallback(() => {
        setLoop((prev) => {
            let newType: "none" | "track" | "playlist" = "none";
            if (prev === "none") newType = "track";
            else if (prev === "track") newType = "playlist";

            setSetting("loopMode", newType);
            return newType;
        });
    }, []);

    const playTrack = useCallback(async (track: Track, index: number, total: number) => {
        if (index < 0 || index >= total || !audioRef.current) {
            setIsPlaying(false);
            setCurrentTrackIndex(-1);
            setCurrentTime(0);
            setCurrentLyricIndex(-1);
            return;
        }

        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setCurrentLyricIndex(-1);

        setTimeout(() => lyricsRef.current && (lyricsRef.current.scrollTop = 0), 10);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current.currentTime = 0;
            audioRef.current.src = track.url;
            try {
                audioRef.current.load();
                await audioRef.current.play();
                setIsPlaying(true);

                const player = document.querySelector("div.group.audio-player");
                if (player) {
                    setTimeout(() => {
                        player.classList.add("expanded");
                        setTimeout(() => player.classList.remove("expanded"), 3000);
                    }, 1000);
                }
            } catch (err) {
                console.error("Playback error:", err);
                setIsPlaying(false);
            }
        }
    }, []);

    const resetState = useCallback(() => {
        setIsPlaying(false);
        setCurrentTrackIndex(-1);
        setCurrentTime(0);
        setCurrentLyricIndex(-1);
        if (audioRef.current) {
            audioRef.current.src = "";
        }
        glanceRef.current?.classList.toggle("lyrics-bg", false);
        glanceRef.current?.classList.toggle("lyrics", false);
    }, []);

    const handlePlay = useCallback(
        async (newIndex: number) => await playTrack(queue[newIndex], newIndex, queue.length),
        [queue]
    );

    const playNext = useCallback(async () => {
        if (currentTrackIndex + 1 < queue.length) await handlePlay(currentTrackIndex + 1);
        else if (loop === "playlist" && queue.length > 0) await handlePlay(0);
        else resetState();
    }, [currentTrackIndex, loop, queue]);

    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    }, []);

    const handleEnded = useCallback(async () => {
        if (loop === "track" && currentTrackIndex >= 0) await handlePlay(currentTrackIndex);
        else await playNext();
    }, [currentTrackIndex, loop]);

    const loadedMetadata = useCallback(() => setDuration(audioRef.current?.duration || 0), []);

    useEffect(() => {
        let animationFrameId: number;
        let start: { x: number; y: number } = { x: 50, y: 50 };
        let target: { x: number; y: number } = { x: Math.random() * 100, y: Math.random() * 100 };
        let control: { x: number; y: number } = { x: 0, y: 0 };
        let prevControl: { x: number; y: number } | null = null; // Store previous control point
        let startTime: number | null = null;
        const speed = 10; // Constant velocity in %/s
        const arcSize = 0.75; // Arc size multiplier

        const clamp = (value: number, min: number, max: number) =>
            Math.max(min, Math.min(max, value));

        const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
            Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

        const updateControlPoint = (
            prevStart: { x: number; y: number },
            prevTarget: { x: number; y: number }
        ) => {
            const midX = (start.x + target.x) / 2;
            const midY = (start.y + target.y) / 2;
            const dist = distance(start, target);
            const offset = dist * arcSize;

            let newControl: { x: number; y: number };

            if (prevControl) {
                // Reflect the previous control point over the midpoint of the new segment
                // to maintain continuity in the curve's direction
                const prevMidX = (prevStart.x + prevTarget.x) / 2;
                const prevMidY = (prevStart.y + prevTarget.y) / 2;
                // Calculate reflection of prevControl relative to the new segment's midpoint
                const deltaX = prevControl.x - prevMidX;
                const deltaY = prevControl.y - prevMidY;
                newControl = {
                    x: clamp(midX - deltaX * arcSize, 0, 100),
                    y: clamp(midY - deltaY * arcSize, 0, 100),
                };
            } else {
                // Initial control point (no previous control point)
                newControl = {
                    x: clamp(midX + (Math.random() - 0.5) * offset, 0, 100),
                    y: clamp(midY + (Math.random() - 0.5) * offset, 0, 100),
                };
            }

            return newControl;
        };

        const animate = (time: number) => {
            if (!startTime) startTime = time;

            const dist = distance(start, target);
            const duration = (dist / speed) * 1000;
            const elapsed = time - startTime;
            let t = duration > 0 ? elapsed / duration : 1;
            t = Math.min(t, 1);

            const easedT = t * (2 - t); // Ease-in-out
            const u = 1 - easedT;
            let x = u * u * start.x + 2 * u * easedT * control.x + easedT * easedT * target.x;
            let y = u * u * start.y + 2 * u * easedT * control.y + easedT * easedT * target.y;

            if (rootRef.current) {
                const pos = `circle at ${x}% ${y}% in oklab`;
                rootRef.current.style.setProperty("--tw-gradient-position", pos);
                rootRef.current.style.backgroundImage = `radial-gradient(var(--tw-gradient-stops,${pos}))`;
            }

            if (t < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // Move to next random position
                const prevStart = { ...start };
                const prevTarget = { ...target };
                start = { x, y };
                target = { x: Math.random() * 100, y: Math.random() * 100 };
                prevControl = { ...control }; // Store current control point
                control = updateControlPoint(prevStart, prevTarget); // Pass previous points
                startTime = null;
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        // Initialize control point and start animation
        control = updateControlPoint(start, target); // Initial call with current start/target
        animationFrameId = requestAnimationFrame(animate);

        // Cleanup on unmount
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <PlaylistProvider resetState={resetState}>
            <div
                ref={rootRef}
                className="mx-auto p-2 sm:p-4 from-white to-gray-300 dark:from-gray-600 dark:to-gray-900 min-h-screen h-screen max-h-screen flex flex-col gap-2 sm:gap-4 overflow-auto">
                <AppContent playTrack={playTrack} />

                {/* Audio Player */}
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-40 max-w-[90%] sm:max-w-[400px]">
                    <AudioPlayerMemo
                        loadedMetadata={loadedMetadata}
                        handleTimeUpdate={handleTimeUpdate}
                        handleEnded={handleEnded}
                        islandComp={<AudioPlayerIslandMemo duration={duration} />}
                        trackComp={<AudioPlayerTrackMemo />}
                        controllerComp={
                            <AudioPlayerControllerMemo
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                loop={loop}
                                toggleLoop={toggleLoop}
                                handlePlay={handlePlay}
                                playNext={playNext}
                            />
                        }
                        timelineComp={<AudioPlayerTimelineMemo duration={duration} />}
                        volumeComp={<AudioPlayerVolumeMemo />}
                    />
                </div>
            </div>
        </PlaylistProvider>
    );
};

const App: React.FC = () => {
    return (
        <SharedRefProvider>
            <ServiceProvider>
                <SelectedTrackProvider>
                    <AppService />
                </SelectedTrackProvider>
            </ServiceProvider>
        </SharedRefProvider>
    );
};

export default App;
