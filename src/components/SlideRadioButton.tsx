import {
    useState,
    ReactElement,
    Children,
    useCallback,
    FC,
    useContext,
    createContext,
    memo,
    useMemo,
    useEffect,
} from "react";
import { cn } from "../lib/utils";

interface SliderRadioButtonProps {
    className?: string;
    children: ReactElement[];
    initialSelectedIndex?: number;
    onChange?: (selectedIndex: number) => void;
}

interface SliderContextProps {
    selected: number;
    handleClick: (index: number) => void;
}

const SliderContext = createContext<SliderContextProps>({
    selected: 0,
    handleClick: () => {},
});

type ButtonOverride<T> = Omit<
    React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    keyof T
> &
    T;
interface SliderOptionProps
    extends ButtonOverride<{
        index: number;
        children: ReactElement;
        keyAccelerator?: string;
        keyModifier?: {
            ctrl?: boolean;
            meta?: boolean;
            alt?: boolean;
            shift?: boolean;
        };
    }> {}

const SliderOptionRaw: FC<SliderOptionProps> = ({
    index,
    children,
    keyAccelerator,
    keyModifier,
    ...props
}) => {
    const { selected, handleClick } = useContext(SliderContext);

    useEffect(() => {
        if (!keyAccelerator) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const focusedTag = active?.tagName ?? "";
            const isTextField =
                focusedTag === "INPUT" ||
                focusedTag === "TEXTAREA" ||
                active?.getAttribute("contenteditable") === "true";

            if (isTextField) return; // Allow native behavior

            const mod: SliderOptionProps["keyModifier"] = {
                ctrl: keyModifier?.ctrl || false,
                meta: keyModifier?.meta || false,
                alt: keyModifier?.alt || false,
                shift: keyModifier?.shift || false,
            };

            if (
                e.ctrlKey !== mod.ctrl ||
                e.metaKey !== mod.meta ||
                e.altKey !== mod.alt ||
                e.shiftKey !== mod.shift
            )
                return;

            if (e.code === keyAccelerator) {
                e.preventDefault();
                handleClick(index);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [keyModifier]);

    return (
        <button
            className={cn(
                "relative z-10 h-full flex-1 flex flex-col justify-center items-center text-center transition-colors duration-200 ease-in-out text-sm sm:text-base",
                "cursor-pointer *:cursor-pointer",
                selected === index ? "text-[var(--text-accent)]" : "text-[var(--text-secondary)]"
            )}
            onClick={() => handleClick(index)}
            {...props}>
            {children}
        </button>
    );
};

const SliderOption = memo(SliderOptionRaw);
export { SliderOption };

const SliderRadioButtonRaw: FC<SliderRadioButtonProps> = ({
    className,
    children,
    initialSelectedIndex = 0,
    onChange,
}) => {
    const [selected, setSelected] = useState(initialSelectedIndex);
    const count = Children.count(children);

    const handleClick = useCallback(
        (index: number) => {
            setSelected(index);
            onChange?.(index);
        },
        [onChange]
    );

    const providerMemo = useMemo(() => ({ selected, handleClick }), [selected, handleClick]);

    return (
        <div className={cn("w-full p-1 bg-[var(--bg-secondary)] rounded-md", className)}>
            <div className="relative w-full h-full bg-[var(--bg-secondary)] rounded-sm flex justify-between items-center">
                {/* Slider Indicator */}
                <div
                    className="absolute top-0 left-0 h-full transition-all duration-300 ease-in-out bg-[var(--bg-accent)] rounded-sm"
                    style={{
                        width: `${100 / count}%`,
                        transform: `translateX(${selected * 100}%)`,
                    }}
                />

                <SliderContext.Provider value={providerMemo}>{children}</SliderContext.Provider>
            </div>
        </div>
    );
};

const SliderRadioButton = memo(SliderRadioButtonRaw);
export default SliderRadioButton;
