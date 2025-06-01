import { NavigationRoute, Route, registerRoute } from "workbox-routing";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { CacheFirst, NetworkFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();

const imageRoute = new Route(
	({ request, sameOrigin }) => {
		return sameOrigin && request.destination === "image";
	},
	new CacheFirst({
		cacheName: "images",
	})
);
registerRoute(imageRoute);

const navigationRoute = new NavigationRoute(
	new NetworkFirst({ cacheName: "navigation", networkTimeoutSeconds: 3 })
);
registerRoute(navigationRoute);
