export class WebRTCSync {
	private peer: RTCPeerConnection;
	private channel: RTCDataChannel | null = null;
	private deviceId: string;
	private onMessage: (msg: any) => void;

	constructor(deviceId: string, onMessage: (msg: any) => void) {
		this.deviceId = deviceId;
		this.onMessage = onMessage;
		this.peer = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});
		this.setupChannel();
	}

	private setupChannel() {
		this.channel = this.peer.createDataChannel("sync");
		this.channel.onmessage = (event) => this.onMessage(JSON.parse(event.data));
		this.peer.onicecandidate = (event) => {
			if (event.candidate) console.log("ICE Candidate:", event.candidate);
		};
	}

	async connectToPeer(offer: RTCSessionDescriptionInit) {
		await this.peer.setRemoteDescription(offer);
		const answer = await this.peer.createAnswer();
		await this.peer.setLocalDescription(answer);
		return answer;
	}

	async initiateConnection() {
		const offer = await this.peer.createOffer();
		await this.peer.setLocalDescription(offer);
		return offer;
	}

	send(data: any) {
		if (this.channel?.readyState === "open") {
			this.channel.send(JSON.stringify(data));
		}
	}

	// Public method to close the connection
	close() {
		this.peer.close();
		this.channel?.close();
	}
}
