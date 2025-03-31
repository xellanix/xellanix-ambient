export {};

declare global {
	interface ServiceWorkerGlobalScope {
		addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
		skipWaiting: () => Promise<void>;
		clients: Clients;
	}
}
