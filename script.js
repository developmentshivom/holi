import { db, ref, set, onValue, child, push } from "./firebase.js";

let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const roomRef = ref(db, "rooms/holi-room");
let localStream;

// 📡 Get local media
async function getLocalMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById("localVideo").srcObject = localStream;
        console.log("✅ Local media acquired.");
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

    console.log("📡 Creating WebRTC Offer...");
    await set(roomRef, { offer: offer });

    console.log("✅ Offer sent.");
}

// 📡 Handle incoming offer & create answer
async function handleOffer(snapshot) {
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    if (!data.offer) return;

    console.log("📡 Offer received, creating answer...");
    peerConnection = new RTCPeerConnection(config);
    setupPeerConnection();

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("✅ Answer sent.");
    await set(child(roomRef, "answer"), answer);
}

// 📡 Handle incoming answer
async function handleAnswer(snapshot) {
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    if (!data) return;

    console.log("📡 Answer received, setting remote description...");
    if (peerConnection.signalingState === "have-local-offer") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    }
}

// 📡 Handle ICE candidates
async function handleICECandidate(snapshot) {
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    if (!data.candidate) return;

    console.log("📡 ICE Candidate received:", data.candidate);
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

// 📡 Setup WebRTC connection
function setupPeerConnection() {
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("📡 Sending ICE Candidate:", event.candidate);
            push(child(roomRef, "candidates"), { candidate: event.candidate });
        }
    };

    peerConnection.ontrack = event => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
        console.log("📡 Remote track received!");
    };
}

// 🔄 Firebase listeners for signaling
onValue(roomRef, handleOffer);
onValue(child(roomRef, "answer"), handleAnswer);
onValue(child(roomRef, "candidates"), handleICECandidate);

// 🚀 Start WebRTC connection
getLocalMedia();
document.getElementById("startButton").addEventListener("click", createOffer);
