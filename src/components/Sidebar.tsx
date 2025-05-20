import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "./Button/Button";
import {
    Moon02Icon,
    Playlist03Icon,
    Sorting04Icon,
    SpeechToTextIcon,
    Sun03Icon,
} from "@hugeicons-pro/core-solid-rounded";
import React, { useCallback, useEffect, useState } from "react";
import SliderRadioButton, { SliderOption } from "./SlideRadioButton";
import Playlist from "./Playlist";
import Queue from "./Queue";

const MemoHugeiconsIcon = React.memo(({ icon }: { icon: IconSvgElement }) => {
    return <HugeiconsIcon icon={icon} className="size-4" strokeWidth={0} />;
});

interface ViewSelectorProps {
    onChange: (selectedIndex: number) => void;
}

interface LyricsDisplayToggleProps {
    showLyrics: boolean;
    toggleLyrics: () => void;
}

const ViewSelector = React.memo(({ onChange }: ViewSelectorProps) => {
    return (
        <SliderRadioButton className="w-16 h-9" onChange={onChange}>
            <SliderOption index={0}>
                <MemoHugeiconsIcon icon={Playlist03Icon} />
            </SliderOption>
            <SliderOption index={1}>
                <MemoHugeiconsIcon icon={Sorting04Icon} />
            </SliderOption>
        </SliderRadioButton>
    );
});

const LyricsDisplayToggle = React.memo(({ showLyrics, toggleLyrics }: LyricsDisplayToggleProps) => {
    return (
        <Button
            styleType={showLyrics ? "accent" : "secondary"}
            onClick={toggleLyrics}
            className="w-8 h-7.5 [--button-p:theme(padding.2)]"
            title="Show/Hide Lyrics (C)">
            <MemoHugeiconsIcon icon={SpeechToTextIcon} />
        </Button>
    );
});

const getTheme = () => {
    const isDark = window.localStorage.getItem("theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    return isDark;
};
const HeaderMemo = React.memo(() => {
    const [darkMode, setDarkMode] = useState<boolean>(getTheme);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => {
            const isDark = !prev;
            document.documentElement.classList.toggle("dark", isDark);
            window.localStorage.setItem("theme", isDark ? "dark" : "light");
            return isDark;
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

            switch (e.code) {
                case "KeyD": {
                    e.preventDefault();
                    toggleDarkMode();
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
        <>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src="./icon-sq.svg" alt="Xellanix icon" className="size-7" />
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-normal)]">
                        Ambient
                    </h1>
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                    <Button
                        styleType="secondary"
                        onClick={toggleDarkMode}
                        className="w-8 h-7.5 [--button-p:theme(padding.2)]"
                        title="Light/Dark Mode (D)">
                        <HugeiconsIcon
                            icon={Moon02Icon}
                            altIcon={Sun03Icon}
                            showAlt={darkMode}
                            className="size-4"
                            strokeWidth={0}
                        />
                    </Button>
                </div>
            </div>
        </>
    );
});

const SidebarMemo = React.memo(
    ({
        playTrack,
        showLyrics,
        toggleLyrics,
    }: {
        playTrack: any;
        showLyrics: boolean;
        toggleLyrics: any;
    }) => {
        const [viewMode, setViewMode] = useState<"playlist" | "queue">("playlist");

        const changeSidebarView = useCallback((selectedIndex: number) => {
            switch (selectedIndex) {
                case 0:
                    setViewMode("playlist");
                    break;
                case 1:
                    setViewMode("queue");
                    break;
            }
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

                switch (e.code) {
                    case "KeyC": {
                        e.preventDefault();
                        toggleLyrics();
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
            <div className="w-full sm:w-1/4 sm:min-w-[300px] flex flex-col not-sm:pb-10 sm:pb-8">
                <div className="flex-1 bg-[var(--bg-primary)] p-4 rounded-lg flex flex-col gap-4 h-full max-h-[50dvh] sm:max-h-full">
                    <HeaderMemo />
                    {/* Content Area */}
                    <div className="flex flex-col flex-1 h-full max-h-full overflow-hidden">
                        {viewMode === "playlist" ? (
                            <Playlist
                                playTrack={playTrack}
                                className="!p-0 flex flex-col flex-1 overflow-hidden"
                            />
                        ) : (
                            <Queue
                                playTrack={playTrack}
                                className="!p-0 flex flex-col flex-1 overflow-hidden"
                            />
                        )}
                    </div>
                    {/* Divider */}
                    <div className="border-t border-[var(--bg-tertiary)]" />
                    {/* Sliding Puzzle Switcher */}
                    <div className="relative flex justify-center items-center gap-2">
                        <ViewSelector onChange={changeSidebarView} />
                        <LyricsDisplayToggle showLyrics={showLyrics} toggleLyrics={toggleLyrics} />
                    </div>
                </div>
            </div>
        );
    }
);

export { ViewSelector, LyricsDisplayToggle, SidebarMemo };
