export interface Track {
	file: File;
	url: string;
	name: string;
	hasLyrics: boolean;
	lyricsUrl?: string;
	codec: string;
}

export interface LyricLine {
	time: number;
	text: string;
}
