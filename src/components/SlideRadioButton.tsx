import {
    useState,
    ReactElement,
    Children,
    useCallback,
    FC,
    useContext,
    createContext,
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

export const SliderOption: FC<{ index: number, children: ReactElement }> = ({ index, children }) => {
    const { selected, handleClick } = useContext(SliderContext);

    return (
        <button
            className={cn(
                "relative z-10 h-full flex-1 flex flex-col justify-center items-center text-center transition-colors duration-200 ease-in-out text-sm sm:text-base",
                "cursor-pointer *:cursor-pointer",
                selected === index ? "text-[var(--text-accent)]" : "text-[var(--text-secondary)]"
            )}
            onClick={() => handleClick(index)}>
            {children}
        </button>
    );
};

const SliderRadioButton: FC<SliderRadioButtonProps> = ({
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

                <SliderContext.Provider value={{ selected, handleClick }}>
                    {children}
                </SliderContext.Provider>
            </div>
        </div>
    );
};

export default SliderRadioButton;
