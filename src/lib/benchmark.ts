import { Track } from "../types";
import { shuffleArray } from "./utils";

async function parseJSONfromURL(url: string): Promise<Track[]> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch JSON from URL: ${response.statusText}`);
		}
		const data = await response.json();
		return data as Track[];
	} catch (error) {
		console.error("Error parsing JSON from URL:", error);
		return [];
	}
}

function cloneArrayElements<T>(arr: T[], times: number): T[] {
	if (times <= 0) {
		return []; // Return an empty array if cloning 0 or fewer times
	}

	return arr.flatMap((item) => Array(times).fill(item));
}

function benchmark(func: () => void, name: string) {
	const start = performance.now();
	func();
	const end = performance.now();

	console.log(`Time taken (${name}): ${(end - start).toFixed(4)} ms`);
}

export async function test() {
	const url = "http://localhost:5173/playlist.json";
	let playlist = cloneArrayElements(await parseJSONfromURL(url), 20000);
	console.log(`Test 1: ${playlist.length} tracks`);

	benchmark(() => [...playlist].sort(() => Math.random() - 0.5), "sort");
	benchmark(() => shuffleArray(playlist), "Fisher-Yates shuffle");
}
