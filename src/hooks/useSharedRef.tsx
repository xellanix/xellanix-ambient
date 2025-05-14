import React, { createContext, useContext } from "react";

const LyricsContext = createContext<React.RefObject<HTMLDivElement | null>>(React.createRef());
const AudioContext = createContext<React.RefObject<HTMLAudioElement | null>>(React.createRef());
const GlanceContext = createContext<React.RefObject<HTMLDivElement | null>>(React.createRef());

const SharedRefProvider = React.memo(({ children }: { children: React.ReactNode }) => {
    const lyricsRef = React.useRef<HTMLDivElement | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const glanceRef = React.useRef<HTMLDivElement | null>(null);

    return (
        <LyricsContext.Provider value={lyricsRef}>
            <AudioContext.Provider value={audioRef}>
                <GlanceContext.Provider value={glanceRef}>
                    {children}
                </GlanceContext.Provider>
            </AudioContext.Provider>
        </LyricsContext.Provider>
    );
});

const useLyricsRef = () => {
    const lyricsRef = useContext(LyricsContext);

    if (lyricsRef == null) {
        throw new Error("useLyricsRef must be used within a SharedRefProvider");
    }

    return lyricsRef;
};

const useAudioRef = () => {
    const audioRef = useContext(AudioContext);

    if (audioRef == null) {
        throw new Error("useAudioRef must be used within a SharedRefProvider");
    }

    return audioRef;
};

const useGlanceRef = () => {
    const glanceRef = useContext(GlanceContext);

    if (glanceRef == null) {
        throw new Error("useGlanceRef must be used within a SharedRefProvider");
    }

    return glanceRef;
};

export { SharedRefProvider, useLyricsRef, useAudioRef, useGlanceRef };