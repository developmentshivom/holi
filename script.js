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

// WebRTC Setup (Single Definition)
const peerConnection = new RTCPeerConnection({
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },  // Free STUN
        {
            urls: "turn:turn.anyfirewall.com:443",
            username: "webrtc",
            credential: "webrtc"
        } // Example TURN (Replace with a real TURN service)
    ]
});

let localStream, remoteStream;

// Get local media (camera & mic)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        document.getElementById('localVideo').srcObject = stream;
        localStream = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(error => console.error("Error getting user media:", error));

// Ensure remote user connects
peerConnection.ontrack = (event) => {
    console.log("Remote track received!");
    if (!remoteStream) {
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
    }
};

// ICE Candidate Handling (Push multiple candidates)
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        roomRef.child("candidates").push(event.candidate);  // Use .push() instead of .set()
    }
};

// Listen for ICE candidates from Firebase
roomRef.child("candidates").on("child_added", (snapshot) => {
    const candidate = snapshot.val();
    if (candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Check for existing offer or create one
roomRef.once("value", async (snapshot) => {
    const data = snapshot.val();
    if (data?.offer) {
        // If an offer exists, join as the second user
        console.log("Offer found, creating answer...");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        roomRef.child("answer").set(answer);
    } else {
        // No offer exists, create one
        console.log("No offer found, creating one...");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        roomRef.child("offer").set(offer);
    }
});

// Listen for answer
roomRef.child("answer").on("value", async (snapshot) => {
    const answer = snapshot.val();
    if (answer && peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
});
