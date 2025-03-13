// Firebase setup
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://virtual-holi-game-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// WebRTC setup
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const roomRef = db.ref("rooms/holi-room");
let localStream;

// 📡 Get local media
async function getLocalMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = localStream;
        console.log("✅ Local stream acquired.");
    } catch (err) {
        console.error("❌ Error getting local media:", err);
    }
}

// 📡 Create WebRTC Offer
async function createOffer() {
    peerConnection = new RTCPeerConnection(config);
    setupPeerConnection();

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log("📡 Creating WebRTC Offer...", offer);
    await roomRef.set({ offer: offer });

    console.log("✅ Offer sent.");
}

// 📡 Handle incoming offer & create answer
async function handleOffer(snapshot) {
    if (!snapshot.exists()) return;

    const { offer } = snapshot.val();
    if (!offer) return;

    console.log("📡 Offer found, creating answer...");
    peerConnection = new RTCPeerConnection(config);
    setupPeerConnection();

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("✅ Answer sent.");
    await roomRef.update({ answer: answer });
}

// 📡 Handle incoming answer
async function handleAnswer(snapshot) {
    if (!snapshot.exists()) return;

    const { answer } = snapshot.val();
    if (!answer) return;

    console.log("📡 Answer received, setting remote description...");
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// 📡 Handle ICE candidates
async function handleICECandidate(snapshot) {
    if (!snapshot.exists()) return;

    const { candidate } = snapshot.val();
    if (!candidate) return;

    console.log("📡 ICE Candidate received:", candidate);
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// 📡 Setup WebRTC connection
function setupPeerConnection() {
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("📡 Sending ICE Candidate:", event.candidate);
            db.ref(`rooms/holi-room/candidates`).push({ candidate: event.candidate });
        }
    };

    peerConnection.ontrack = event => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
        console.log("📡 Remote track received!");
    };
}

// 🔄 Firebase listeners for signaling
roomRef.on("value", handleOffer);
roomRef.child("answer").on("value", handleAnswer);
roomRef.child("candidates").on("child_added", handleICECandidate);

// 🚀 Start WebRTC connection
getLocalMedia();
document.getElementById("startButton").addEventListener("click", createOffer);
