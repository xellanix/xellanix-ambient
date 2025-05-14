import { cn } from "../../lib/utils";
import "./style.css";

type ButtonOverride<T> = Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, keyof T> & T;

interface IButtonClassNames {
    base?: string;
    depth?: string;
    content?: string;
}

interface IButtonProps {
    className?: string | IButtonClassNames;
    styleType?: "primary" | "secondary" | "accent";
}

interface ButtonProps extends ButtonOverride<IButtonProps> {}

function isString(input: string | IButtonClassNames): input is string {
    return typeof input === "string";
}

export function Button({ className, styleType, children, ...props }: ButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "btn",
                "[--button-p:theme(padding.2)_theme(padding.4)]",
                "[--button-text-size:theme(fontSize.base)]",
                "[--button-text-line-height:theme(lineHeight.6)]",
                "[--button-depth:-0.25rem]",
                "[--button-depth-jump:-0.375rem]",
                "[--button-depth-shrink:-0.125rem]",
                styleType,
                className && (isString(className) ? className : className!.base)
            )}
            {...props}>
            <span className={(className && !isString(className) && className!.depth) || ""} />
            <span className={(className && !isString(className) && className!.content) || ""}>
                {children}
            </span>
        </button>
    );
}
