import React, { useState, useEffect, useRef } from "react";
import MusicPlayer from "./components/MusicPlayer";
import { addSongToLibrary, getLibrary, Song } from "./lib/library";
import { WebRTCSync } from "./lib/webrtc";

// Generate or retrieve a persistent deviceId
const getDeviceId = () => {
    let storedId = localStorage.getItem("deviceId");
    if (!storedId) {
        storedId = "device-" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("deviceId", storedId);
    }
    return storedId;
};
const deviceId = getDeviceId();

const App: React.FC = () => {
    const [library, setLibrary] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [devices, setDevices] = useState<string[]>([deviceId]);
    const rtcRef = useRef<WebRTCSync | null>(null);

    useEffect(() => {
        setLibrary(getLibrary());

        const sync = new WebRTCSync(deviceId, (msg) => {
            if (msg.type === "library") setLibrary(msg.data);
            if (msg.type === "play") setCurrentSong(msg.data);
            if (msg.type === "device") setDevices((prev) => [...prev, msg.data]);
        });
        rtcRef.current = sync;
        sync.initiateConnection().then((offer) => console.log("Offer:", offer));

        sync.send({ type: "device", data: deviceId });

        console.log("Current deviceId:", deviceId);
        console.log("Devices:", devices);
        console.log("Library:", getLibrary());

        return () => {
            sync.close();
        };
    }, []);

    const handleAddSong = () => {
        const song: Song = {
            id: crypto.randomUUID(), // Unique ID for each song
            title: "Sample Song",
            file: "/song.flac",
            lrc: "/song.lrc",
            ownerDeviceId: deviceId,
        };
        addSongToLibrary(song);
        setLibrary(getLibrary());
        rtcRef.current?.send({ type: "library", data: getLibrary() });
        console.log("Added song with ownerDeviceId:", deviceId);
    };

    const playSong = (song: Song) => {
        console.log("Attempting to play song:", song);
        console.log("Devices:", devices);
        if (devices.includes(song.ownerDeviceId)) {
            setCurrentSong(song);
            rtcRef.current?.send({ type: "play", data: song });
        } else {
            alert("Song owner device is offline.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Music Player</h1>
            <button
                onClick={handleAddSong}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
                Add Sample Song
            </button>
            <div className="w-full max-w-2xl">
                {currentSong && <MusicPlayer song={currentSong.file} lrc={currentSong.lrc} />}
                <h2 className="text-xl font-semibold mt-4">Library</h2>
                <ul className="space-y-2">
                    {library.map((song) => (
                        <li
                            key={song.id}
                            onClick={() => playSong(song)}
                            className="p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-100">
                            {song.title}{" "}
                            {devices.includes(song.ownerDeviceId) ? "(Playable)" : "(Offline)"}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default App;
