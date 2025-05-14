import { memo } from "react";
import { useSelectedTrack } from "../hooks/useService";
import { useGlanceRef } from "../hooks/useSharedRef";

const TrackGlance = memo(() => {
    const selectedTrack = useSelectedTrack();
    const glanceRef = useGlanceRef();

    return (
        <div
            ref={glanceRef}
            className="@container group peer absolute size-full z-50 pointer-events-none flex justify-center items-center overflow-hidden bg-gray-100/0 dark:bg-gray-900/0 transition-colors duration-700 ease-in-out [&.glance]:bg-gray-100 [&.glance]:dark:bg-gray-900">
            {selectedTrack && (
                <div className="flex flex-col @md:flex-row items-center gap-4 @sm:gap-6 @md:gap-8 translate-y-full group-[.glance]:translate-y-0 transition-all duration-700 ease-in-out opacity-0 group-[.glance]:opacity-100">
                    <img className="size-30 @sm:size-40 @md:size-45" src={selectedTrack.coverUrl} />
                    <div className="flex flex-col @max-md:items-center @sm:gap-2 overflow-hidden">
                        <h2 className="text-[var(--text-normal)] text-2xl @sm:text-3xl font-bold m-0 text-balance">
                            {selectedTrack.name}
                        </h2>
                        {selectedTrack.artist && (
                            <p className="text-[var(--text-secondary)] text-lg @sm:text-xl m-0 truncate">
                                {selectedTrack.artist}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export { TrackGlance };
