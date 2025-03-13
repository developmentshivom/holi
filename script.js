// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyD9geqCCQ...",
    authDomain: "virtual-holi-game.firebaseapp.com",
    databaseURL: "https://virtual-holi-game-default-rtdb.firebaseio.com",
    projectId: "virtual-holi-game",
    storageBucket: "virtual-holi-game.appspot.com",
    messagingSenderId: "348578981043",
    appId: "1:348578981043:web:78126b6e1605efab6afcc6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// WebRTC Configuration
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
let peerConnection = new RTCPeerConnection(servers);
let localStream;

// Get Media (Camera + Audio)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    });

// Handle Remote Stream
peerConnection.ontrack = (event) => {
    if (!document.getElementById('remoteVideo').srcObject) {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
    }
};

};

// Firebase Signaling (Real-time Room)
const roomRef = db.ref('rooms/holi-room');
roomRef.on('value', async (snapshot) => {
    const data = snapshot.val();
    if (data?.offer && !peerConnection.remoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        roomRef.set({ answer });
    }
    if (data?.answer && peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

// Create Offer (Only if needed)
(async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    roomRef.set({ offer });
})();

// 🎨 Color Throwing Feature (Canvas Interaction)
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Click to "Throw" Color
canvas.addEventListener('click', (e) => {
    const x = e.clientX / canvas.width;
    const y = e.clientY / canvas.height;
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);

    db.ref('colors/' + Date.now()).set({ x, y, color });
});

peerConnection.oniceconnectionstatechange = () => {
    if (peerConnection.iceConnectionState === 'failed') {
        console.log("ICE Connection Failed. Retrying...");
        peerConnection.restartIce();
    }
};



// Sync Colors Across Users
db.ref('colors').on('value', (snapshot) => {
    snapshot.forEach(child => {
        const { x, y, color } = child.val();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x * canvas.width, y * canvas.height, 20, 0, 2 * Math.PI);
        ctx.fill();
    });
});

// Generate Shareable Link
document.getElementById('link').innerText = window.location.href;
document.getElementById('link').href = window.location.href;
