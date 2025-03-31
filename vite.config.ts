import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,m4a,lrc}"],
				maximumFileSizeToCacheInBytes: 200 * 1024 * 1024, // 100MB
			},
		}),
	],
	css: {
		postcss: "./postcss.config.mjs",
	},
	preprocessorOptions: {
		css: {
			extract: true,
			codeSplit: true,
		},
	},
});
