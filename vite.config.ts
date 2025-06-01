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
			devOptions: {
				enabled: true,
			},
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.ts",
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,m4a,lrc}"],
				maximumFileSizeToCacheInBytes: 200 * 1024 * 1024, // 100MB
			},
			injectManifest: {
				swDest: "dist/sw.js",
			},
			manifest: {
				name: "Xellanix Ambient",
				short_name: "Xellanix Ambient",
				background_color: "#ffffff",
				theme_color: "#ffffff",
				description: "A Music Player with Enhanced Lyrics Display",
				display: "standalone",
				orientation: "any",
				icons: [
					{
						src: "pwa-64x64.png",
						sizes: "64x64",
						type: "image/png",
					},
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "maskable-icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
	],
	base: "",
	css: {
		postcss: "./postcss.config.mjs",
	},
});
