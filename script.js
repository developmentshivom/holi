// 🔥 Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD9geqCCQlvh725M5aV22hYWUNa2YU6qYM",
    authDomain: "virtual-holi-game.firebaseapp.com",
    databaseURL: "https://virtual-holi-game-default-rtdb.firebaseio.com",
    projectId: "virtual-holi-game",
    storageBucket: "virtual-holi-game.appspot.com",
    messagingSenderId: "348578981043",
    appId: "1:348578981043:web:78126b6e1605efab6afcc6",
    measurementId: "G-9B3T81ZSR8"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const roomRef = database.ref("webrtc-room");

// 🎥 Video Elements
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// 📡 WebRTC Setup
const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// 🎤 Get User Media
async function startLocalStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        console.log("✅ Local stream added.");
    } catch (error) {
        console.error("❌ Error accessing media devices.", error);
    }
}

// 🔄 Handle Remote Stream
peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
    console.log("📡 Remote stream received!");
};

// 📡 ICE Candidate Handling
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        database.ref("webrtc-room/candidates").push(JSON.stringify(event.candidate));
        console.log("📡 ICE Candidate sent:", event.candidate);
    }
};

// 🚀 Start Call (Creates Offer)
document.getElementById("startCall").addEventListener("click", async () => {
    await startLocalStream();
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    database.ref("webrtc-room/offer").set(JSON.stringify(offer));

    console.log("📡 Offer created and sent.");
});

// 🎯 Join Call (Responds with Answer)
document.getElementById("joinCall").addEventListener("click", async () => {
    await startLocalStream();

    database.ref("webrtc-room/offer").once("value", async (snapshot) => {
        if (snapshot.exists()) {
            const offer = JSON.parse(snapshot.val());
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("📡 Offer received.");

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            database.ref("webrtc-room/answer").set(JSON.stringify(answer));
            console.log("✅ Answer created and sent.");
        }
    });
});

// 📡 Listen for Answer
database.ref("webrtc-room/answer").on("value", (snapshot) => {
    if (snapshot.exists()) {
        const answer = JSON.parse(snapshot.val());
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Answer received and applied.");
    }
});

// 📡 Listen for ICE Candidates
database.ref("webrtc-room/candidates").on("child_added", (snapshot) => {
    if (snapshot.exists()) {
        const candidate = JSON.parse(snapshot.val());
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("📡 ICE Candidate received and added.");
    }
});
