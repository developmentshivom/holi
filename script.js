import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

// WebRTC setup
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
let peerConnection = new RTCPeerConnection(servers);
let localStream;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    });

peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
};

// Firebase signaling
const roomRef = ref(db, 'rooms/holi-room');
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

// Color throwing functionality
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('click', (e) => {
    const x = e.clientX / canvas.width;
    const y = e.clientY / canvas.height;
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    set(ref(db, 'colors/' + Date.now()), { x, y, color });
});

onValue(ref(db, 'colors'), (snapshot) => {
    snapshot.forEach(child => {
        const { x, y, color } = child.val();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x * canvas.width, y * canvas.height, 20, 0, 2 * Math.PI);
        ctx.fill();
    });
});

// Generate invite link
document.getElementById('link').innerText = window.location.href;
document.getElementById('link').href = window.location.href;
