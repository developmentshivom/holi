// 🔥 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD9geqCCQ...",
    authDomain: "virtual-holi-game.firebaseapp.com",
    databaseURL: "https://virtual-holi-game-default-rtdb.firebaseio.com",
    projectId: "virtual-holi-game",
    storageBucket: "virtual-holi-game.appspot.com",
    messagingSenderId: "348578981043",
    appId: "1:348578981043:web:78126b6e1605efab6afcc6"
};

// 🔥 Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🌍 WebRTC Configuration
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
let peerConnection = new RTCPeerConnection(servers);
let localStream;

// 📡 Initialize WebRTC
async function initWebRTC() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('localVideo').srcObject = localStream;

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = (event) => {
            document.getElementById('remoteVideo').srcObject = event.streams[0];
        };

        setupSignaling();
    } catch (error) {
        console.error("Error accessing media devices:", error);
    }
}

// 🔁 Setup Firebase Signaling (Real-time Communication)
function setupSignaling() {
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

    createOffer(roomRef);
}

// 🌍 Create Web
