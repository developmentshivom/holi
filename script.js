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
        roomRef.child("candidate").set(event.candidate);
    }
};

// Listen for ICE candidates from Firebase
roomRef.child("candidate").on("value", (snapshot) => {
    const candidate = snapshot.val();
    if (candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});
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

// Listen for offer
roomRef.on("value", async (snapshot) => {
    const data = snapshot.val();
    if (data?.offer && !peerConnection.remoteDescription) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        roomRef.child("answer").set(answer);
    }
    if (data?.answer && peerConnection.signalingState === 'have-local-offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

// Offer creation
(async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    roomRef.child("offer").set(offer);
})();
