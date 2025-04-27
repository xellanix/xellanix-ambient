export interface Track {
	name: string;
	artist?: string; // Optional to fix Playlist.tsx errors
	url: string;
	hasLyrics: boolean;
	lyricsUrl?: string;
	coverUrl?: string;
	album?: string;
	duration?: number;
	genre?: string;
	file?: File; // For uploaded audio
	codec?: string; // Audio codec (e.g., 'audio/mpeg')
}

export interface LyricLine {
	time: number;
	text: string;
}

export type RemoveProps<T, K> = Omit<T, keyof K>;
export type Override<T, K> = RemoveProps<T, K> & K;
export type FilterReactProps<T, K> = Override<RemoveProps<T, { defaultChecked?: boolean }>, K>;

export type HTMLProps<T, U> = FilterReactProps<React.HTMLAttributes<T>, U>;
