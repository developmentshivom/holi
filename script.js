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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const roomRef = db.ref('rooms/holi-room');

// WebRTC Setup
const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },  // Free STUN server
        {
            urls: "turn:turn.anyfirewall.com:443", // Replace with a real TURN service if needed
            username: "webrtc",
            credential: "webrtc"
        }
    ]
};

let peerConnection = new RTCPeerConnection(servers);
let localStream, remoteStream = new MediaStream();

// Assign remote stream to video element
document.getElementById('remoteVideo').srcObject = remoteStream;

// Get user media
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        console.log("✅ Local stream acquired.");
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(error => console.error("❌ Error accessing media devices:", error));

// Ensure remote user connects
peerConnection.ontrack = (event) => {
    console.log("📡 Remote track received!");
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
};

// ICE Candidate Handling - Send to Firebase
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        console.log("📡 Sending ICE Candidate:", event.candidate);
        roomRef.child("candidates").push(event.candidate); // Store multiple candidates
    } else {
        console.log("❌ No more ICE candidates.");
    }
};

// Listen for ICE candidates from Firebase
roomRef.child("candidates").on("child_added", (snapshot) => {
    const candidate = snapshot.val();
    if (candidate) {
        console.log("✅ Received ICE Candidate:", candidate);
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(error => console.error("❌ Failed to add ICE Candidate:", error));
    }
});

// Listen for WebRTC offer or answer in Firebase
roomRef.on("value", async (snapshot) => {
    const data = snapshot.val();
    
    if (data?.offer && !peerConnection.remoteDescription) {
        console.log("📡 Offer found, creating answer...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        roomRef.child("answer").set(answer);
        console.log("✅ Answer sent.");
    }

    if (data?.answer && peerConnection.signalingState === 'have-local-offer') {
        console.log("📡 Answer received, setting remote description...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

// Create WebRTC Offer
(async () => {
    console.log("📡 Creating WebRTC Offer...");
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    roomRef.child("offer").set(offer);
    console.log("✅ Offer sent.");
})();
