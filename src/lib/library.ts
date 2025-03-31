export interface Song {
	id: string;
	title: string;
	file: string;
	lrc: string;
	ownerDeviceId: string;
}

export const addSongToLibrary = (song: Song) => {
	const library = JSON.parse(localStorage.getItem("library") || "[]") as Song[];
	library.push(song);
	localStorage.setItem("library", JSON.stringify(library));
};

export const getLibrary = (): Song[] => {
	return JSON.parse(localStorage.getItem("library") || "[]");
};
