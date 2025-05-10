import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Track } from "../types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function pp(path: string) {
	return process.env.NODE_ENV === "production" ? `./${path}` : `/${path}`;
}
export function binarySearch(array: Track[], id: number): number {
	if (id < 0) return -1;

	let low = 0,
		high = array.length - 1;
	let mid = Math.floor((low + high) / 2);

	if (array[mid].id === id) return mid;
	else if (array[low].id === id) return low;
	else if (array[high].id === id) return high;
	else if (array[low].id > id || array[high].id < id) return -1;

	while (array[mid].id != id) {
		if (id < array[mid].id) {
			high = mid - 1;
			if (array[high].id === id) return high;
		} else {
			low = mid + 1;
			if (array[low].id === id) return low;
		}
		mid = Math.floor((low + high) / 2);

		if (array[mid].id === id) return mid;
	}

	return -1;
}

/**
 * Helper function to shuffle an array using the Fisher-Yates shuffle algorithm
 * @param array Array to shuffle
 * @returns Shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
	const result = array.slice(); // shallow copy
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
