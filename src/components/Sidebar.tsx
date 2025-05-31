import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "./Button/Button";
import {
    Moon02Icon,
    Playlist03Icon,
    Sorting04Icon,
    Sun03Icon,
} from "@hugeicons-pro/core-solid-rounded";
import React, { useCallback, useEffect, useState } from "react";
import SliderRadioButton, { SliderOption } from "./SlideRadioButton";
import Playlist from "./Playlist";
import Queue from "./Queue";
import Tooltip from "rc-tooltip";
import { APP_VERSION, getSetting, setSetting } from "../lib/migration";

const MemoHugeiconsIcon = React.memo(({ icon }: { icon: IconSvgElement }) => {
    return <HugeiconsIcon icon={icon} className="size-4" strokeWidth={0} />;
});

interface ViewSelectorProps {
    onChange: (selectedIndex: number) => void;
}

const ViewSelector = React.memo(({ onChange }: ViewSelectorProps) => {
    return (
        <SliderRadioButton className="w-16 h-9" onChange={onChange}>
            <Tooltip
                overlay={
                    <>
                        Playlist
                        <div className="flex gap-1 items-center flex-nowrap">
                            <div className="bg-[var(--bg-secondary)] w-10 h-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                Shift
                            </div>
                            +
                            <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                P
                            </div>
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <SliderOption index={0} keyAccelerator="KeyP" keyModifier={{ shift: true }}>
                    <MemoHugeiconsIcon icon={Playlist03Icon} />
                </SliderOption>
            </Tooltip>
            <Tooltip
                overlay={
                    <>
                        Queue
                        <div className="flex gap-1 items-center flex-nowrap">
                            <div className="bg-[var(--bg-secondary)] w-10 h-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                Shift
                            </div>
                            +
                            <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                Q
                            </div>
                        </div>
                    </>
                }
                classNames={{
                    root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                    body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !items-center !gap-2",
                }}
                showArrow={false}
                mouseEnterDelay={0.5}
                placement="top"
                align={{ offset: [0, -16] }}>
                <SliderOption
                    index={1}
                    keyAccelerator="KeyQ"
                    keyModifier={{ shift: true, alt: undefined }}>
                    <MemoHugeiconsIcon icon={Sorting04Icon} />
                </SliderOption>
            </Tooltip>
        </SliderRadioButton>
    );
});

const getTheme = () => {
    const isDark = getSetting("theme") === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    return isDark;
};
const HeaderMemo = React.memo(() => {
    const [darkMode, setDarkMode] = useState<boolean>(getTheme);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => {
            const isDark = !prev;
            document.documentElement.classList.toggle("dark", isDark);
            setSetting("theme", isDark ? "dark" : "light");
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

            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

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
                    <Tooltip
                        overlay={
                            <>
                                <div className="flex gap-2 items-center font-bold">
                                    Xellanix Ambient
                                    <div className="bg-[var(--bg-secondary)] w-12 h-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                        v{APP_VERSION}
                                    </div>
                                </div>
                                &copy; 2025 Xellanix
                            </>
                        }
                        classNames={{
                            root: "!bg-[var(--bg-primary)] !p-0 !opacity-100 shadow-sm !rounded-md",
                            body: "!text-[var(--text-secondary)] !bg-[var(--bg-primary)] !rounded-sm !border-none !flex !flex-col !items-center !gap-2",
                        }}
                        showArrow={false}
                        mouseEnterDelay={0.5}
                        align={{ offset: [0, 16] }}
                        placement="bottom">
                        <div className="flex items-center gap-2">
                            <img src="./icon-sq.svg" alt="Xellanix icon" className="size-7" />
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-normal)]">
                                Ambient
                            </h1>
                        </div>
                    </Tooltip>
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                    <Tooltip
                        overlay={
                            <>
                                Light/Dark Mode
                                <div className="bg-[var(--bg-secondary)] size-6 rounded-sm flex justify-center items-center font-bold border-b-2 border-[var(--bg-tertiary)]">
                                    D
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
                            onClick={toggleDarkMode}
                            className="w-8 h-7.5 [--button-p:theme(padding.2)]">
                            <HugeiconsIcon
                                icon={Moon02Icon}
                                altIcon={Sun03Icon}
                                showAlt={darkMode}
                                className="size-4"
                                strokeWidth={0}
                            />
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </>
    );
});

const SidebarMemo = React.memo(({ playTrack }: { playTrack: any }) => {
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
                </div>
            </div>
        </div>
    );
});

export { ViewSelector, SidebarMemo };
