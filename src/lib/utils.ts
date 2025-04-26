import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function pp(path: string) {
	return process.env.NODE_ENV === "production" ? `./${path}` : `/${path}`;
}
