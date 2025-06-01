function getStorage(key: string): string | null {
	return localStorage.getItem(key) ?? null;
}

function setStorage(key: string, value: string): void {
	localStorage.setItem(key, value);
}

const APP_VERSION = "1.1.1";
const MIGRATION_VERSION = "1.1.1";

function getValueByPath<T>(obj: any, keys: (string | number)[]): T | undefined {
	return keys.reduce((acc, key) => acc?.[key], obj);
}

function setValueByPath(obj: any, keys: (string | number)[], value: any): void {
	if (!keys.length) return;

	let current = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		const nextKey = keys[i + 1];

		if (current[key] === undefined || typeof current[key] !== "object") {
			// Create object or array depending on whether next key is a number
			current[key] = typeof nextKey === "number" ? [] : {};
		}

		current = current[key];
	}

	current[keys[keys.length - 1]] = value;
}

const getPaths = () => {
	let urlPath = window.location.pathname;
	urlPath = urlPath.startsWith("/") ? urlPath.substring(1) : urlPath;
	urlPath = urlPath.endsWith("/") ? urlPath.slice(0, -1) : urlPath;
	const paths = urlPath === "" ? ["xellanix-ambient"] : urlPath.split("/");

	return paths;
};

const checkMigration = (paths: string[]) => {
	const [appName, ...others] = paths;

	const registered =
		getValueByPath<string>(JSON.parse(getStorage(appName) || "{}"), others) || "0.0.0";
	if (registered !== MIGRATION_VERSION) return registered;
	return null;
};

function migrate() {
	const paths = getPaths();

	if (checkMigration(paths.concat(["migrateVersion"])) != null) {
		// Migrate if version is not MIGRATION_VERSION
		console.log("Migrating...");
		const [appName, ...others] = paths;
		const obj: any = {};

		const getLoopMode = getStorage("loopMode") ?? "none";
		const getIsShuffled = getStorage("isShuffled") ?? "0";
		const getIsMuted = getStorage("isMuted") ?? "0";
		const getVolume = getStorage("volume") ?? "100";
		const getTheme = getStorage("theme") ?? "light";

		setValueByPath(obj, others.concat(["appVersion"]), APP_VERSION);
		setValueByPath(obj, others.concat(["migrateVersion"]), MIGRATION_VERSION);
		setValueByPath(obj, others.concat(["loopMode"]), getLoopMode);
		setValueByPath(obj, others.concat(["isShuffled"]), getIsShuffled);
		setValueByPath(obj, others.concat(["isMuted"]), getIsMuted);
		setValueByPath(obj, others.concat(["volume"]), getVolume);
		setValueByPath(obj, others.concat(["theme"]), getTheme);

		setStorage(appName, JSON.stringify(obj));

		localStorage.removeItem("loopMode");
		localStorage.removeItem("isShuffled");
		localStorage.removeItem("isMuted");
		localStorage.removeItem("volume");
		localStorage.removeItem("theme");
		localStorage.removeItem("appVersion");

		console.log("Migrated!");
		window.location.reload();
	}
}

function getSetting(key: string) {
	const paths = getPaths();
	const [appName, ...others] = paths;
	return (
		getValueByPath<string>(JSON.parse(getStorage(appName) || ""), others.concat([key])) || null
	);
}

function setSetting(key: string, value: string) {
	const paths = getPaths();
	const [appName, ...others] = paths;
	const obj: any = JSON.parse(getStorage(appName) || "");
	setValueByPath(obj, others.concat([key]), value);
	setStorage(appName, JSON.stringify(obj));
}

export { APP_VERSION, migrate, getSetting, setSetting };
