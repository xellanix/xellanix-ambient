import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

// Explicitly type self as ServiceWorkerGlobalScope
const swSelf = self as unknown as ServiceWorkerGlobalScope;

precacheAndRoute((self as any).__WB_MANIFEST);

// Stream large audio files with NetworkFirst strategy
registerRoute(
	({ url }) => url.pathname.endsWith(".m4a"),
	new NetworkFirst({
		cacheName: "audio-files",
		plugins: [
			{
				cacheWillUpdate: async ({ response }) => {
					if (response && response.status === 206) return response; // Partial content
					return null;
				},
			},
		],
	})
);

swSelf.addEventListener("install", () => swSelf.skipWaiting());
swSelf.addEventListener("activate", () => swSelf.clients.claim());
