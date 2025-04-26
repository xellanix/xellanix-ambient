import { cn } from "../../lib/utils";
import "./style.css";

type ButtonOverride<T> = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof T> & T;

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
