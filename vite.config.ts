import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const ReactCompilerConfig = {
	/* ... */
};

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
			},
		}),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,m4a,lrc}"],
				maximumFileSizeToCacheInBytes: 200 * 1024 * 1024, // 100MB
			},
		}),
	],
	base: "",
	css: {
		postcss: "./postcss.config.mjs",
	},
});
