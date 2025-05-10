import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "./Button/Button";
import { Playlist03Icon, Sorting04Icon, SpeechToTextIcon } from "@hugeicons-pro/core-solid-rounded";
import React, { useCallback, useState } from "react";
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
            title={showLyrics ? "Hide Lyrics" : "Show Lyrics"}>
            <MemoHugeiconsIcon icon={SpeechToTextIcon} />
        </Button>
    );
});

const SidebarMemo = React.memo(
    ({
        playlist,
        setPlaylist,
        playTrack,
        showLyrics,
        toggleLyrics,
    }: {
        playlist: any[];
        setPlaylist: any;
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

        return (
            <div className="w-full sm:w-1/4 sm:min-w-[300px] flex flex-col not-sm:pb-10">
                <div className="flex-1 bg-[var(--bg-primary)] rounded-lg flex flex-col h-full max-h-[50dvh] sm:max-h-full">
                    {/* Content Area */}
                    <div className="flex flex-col flex-1 p-4 h-full max-h-full overflow-hidden">
                        {viewMode === "playlist" ? (
                            <Playlist
                                playlist={playlist}
                                setPlaylist={setPlaylist}
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
                    <div className="border-t border-[var(--bg-tertiary)] mx-4" />
                    {/* Sliding Puzzle Switcher */}
                    <div className="relative p-4 flex justify-center items-center gap-2">
                        <ViewSelector onChange={changeSidebarView} />
                        <LyricsDisplayToggle showLyrics={showLyrics} toggleLyrics={toggleLyrics} />
                    </div>
                </div>
            </div>
        );
    }
);

export { ViewSelector, LyricsDisplayToggle, SidebarMemo };
