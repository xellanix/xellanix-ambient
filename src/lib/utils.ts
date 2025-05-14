import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LyricLine, Track } from "../types";
import { parseBlob, selectCover } from "music-metadata";

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

export function findLyricIndex(lyrics: LyricLine[], currentTime: number): number {
	let low = 0;
	let high = lyrics.length - 1;
	let result = -1;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const lyric = lyrics[mid];
		const nextTime = lyrics[mid + 1]?.time ?? Infinity;

		if (currentTime >= lyric.time && currentTime < nextTime) {
			return mid;
		} else if (currentTime < lyric.time) {
			high = mid - 1;
		} else {
			low = mid + 1;
		}
	}

	return result; // No match found
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

export async function fetchLyrics(lyricsFile: File): Promise<LyricLine[]> {
	try {
		const content = await lyricsFile.text();
		const lines = content.split("\n");
		const lyrics: LyricLine[] = [];
		const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/;

		for (const line of lines) {
			const match = line.match(timeRegex);
			if (match) {
				const minutes = parseInt(match[1]);
				const seconds = parseInt(match[2]);
				const milliseconds = parseInt(match[3].padEnd(3, "0"));
				const time = minutes * 60 + seconds + milliseconds / 1000;
				const text = match[4].trim();
				if (text) lyrics.push({ time, text });
			}
		}
		return lyrics;
	} catch (err) {
		console.error("Failed to load lyrics:", err);
		return [];
	}
}

async function uint8ArrayToBase64(data: Uint8Array<ArrayBufferLike>) {
	return new Promise((resolve, reject) => {
		const blob = new Blob([data]);
		const reader = new FileReader();
		reader.onloadend = () => {
			const dataUrl = reader.result as string;
			const base64 = dataUrl.split(",")[1]; // strip "data:application/octet-stream;base64,"
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

async function resizeBase64Image(base64Image: string) {
	return new Promise<string>((resolve) => {
		const maxSizeInMB = 0.05;
		const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
		const img = new Image();
		img.src = base64Image;
		img.onload = function () {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const width = img.width;
			const height = img.height;
			const aspectRatio = width / height;
			const newWidth = Math.sqrt(maxSizeInBytes * aspectRatio);
			const newHeight = Math.sqrt(maxSizeInBytes / aspectRatio);
			canvas.width = newWidth;
			canvas.height = newHeight;
			ctx?.drawImage(img, 0, 0, newWidth, newHeight);
			let quality = 0.8;
			let dataURL = canvas.toDataURL("image/jpeg", quality);
			resolve(dataURL);
		};
	});
}

export async function extractMetadata(file: File) {
	try {
		const _metadata = await parseBlob(file);

		const picture = selectCover(_metadata.common.picture);
		let coverData = picture
			? await resizeBase64Image(
					`data:${picture.format};base64,${await uint8ArrayToBase64(picture.data)}`
			  )
			: "";

		let performer = _metadata.common.artist || "Unknown Artist";

		return {
			audioQuality: "",
			coverData,
			performer,
			title: _metadata.common.title || "Untitled",
		};
	} catch (e) {
		console.error(e);
		return { audioQuality: "", coverData: "", performer: "Unknown Artist", title: "Untitled" };
	}
}
