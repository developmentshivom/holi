import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, doc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let selectedColor = 'red';

// Set canvas size
canvas.width = 640;
canvas.height = 480;

// WebRTC configuration
const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server
  ],
};

let localStream;
let remoteStream;
let peerConnection;

// Start local camera
async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localVideo.srcObject = localStream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please allow camera permissions and ensure your device has a camera.');
  }
}

// Create peer connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);

  // Add local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      setDoc(doc(db, 'calls', 'callee'), { iceCandidate: event.candidate }, { merge: true });
    }
  };
}

// Handle color selection
document.querySelectorAll('.colors button').forEach((button) => {
  button.addEventListener('click', () => {
    selectedColor = button.getAttribute('data-color');
  });
});

// Handle mouse clicks to throw colors
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Draw color locally
  drawColor(x, y, selectedColor);

  // Send color data to the remote peer
  if (peerConnection) {
    const data = { x, y, color: selectedColor };
    peerConnection.getSenders()[0].send(JSON.stringify(data));
  }
});

// Function to draw color on the canvas
function drawColor(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI); // Circle radius: 20px
  ctx.fill();
}

// Start the app
startCamera();
createPeerConnection();
