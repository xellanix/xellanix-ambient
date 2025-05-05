import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Button } from "./Button/Button";
import { Playlist03Icon, Sorting04Icon, SpeechToTextIcon } from "@hugeicons-pro/core-solid-rounded";
import React from "react";
import SliderRadioButton, { SliderOption } from "./SlideRadioButton";

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

export { ViewSelector, LyricsDisplayToggle };
