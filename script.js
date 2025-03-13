import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase Config
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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomRef = ref(db, 'rooms/holi-room');

// WebRTC Setup
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
let peerConnection = new RTCPeerConnection(servers);
let localStream, remoteStream = new MediaStream();

document.getElementById('remoteVideo').srcObject = remoteStream; // Assign remote stream

// Get user media
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    });

// Ensure remote user connects
peerConnection.ontrack = (event) => {
    console.log("Remote track received!");
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
};

// ICE Candidate Handling
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        set(ref(db, `rooms/holi-room/candidate`), event.candidate);
    }
};

// Listen for ICE candidates from Firebase
onValue(ref(db, 'rooms/holi-room/candidate'), (snapshot) => {
    const candidate = snapshot.val();
    if (candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Listen for offer
onValue(roomRef, async (snapshot) => {
    const data = snapshot.val();
    if (data?.offer && !peerConnection.remoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        set(roomRef, { answer });
    }
    if (data?.answer && peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

// Offer creation
(async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    set(roomRef, { offer });
})();
