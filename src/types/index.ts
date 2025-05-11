export interface LyricLine {
	time: number;
	text: string;
}

export interface Track {
	id: number;
	name: string;
	artist: string;
	url: string;
	hasLyrics: boolean;
	lyrics: LyricLine[];
	album: string;
	codec: string;
	coverUrl?: string;
}

export type RemoveProps<T, K> = Omit<T, keyof K>;
export type Override<T, K> = RemoveProps<T, K> & K;
export type FilterReactProps<T, K> = Override<RemoveProps<T, { defaultChecked?: boolean }>, K>;

export type HTMLProps<T, U> = FilterReactProps<React.HTMLAttributes<T>, U>;
