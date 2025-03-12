const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const remoteIdInput = document.getElementById('remote-id');
const connectButton = document.getElementById('connect');
const remoteVideo = document.createElement('video'); // For remote video stream
remoteVideo.autoplay = true;
document.body.appendChild(remoteVideo); // Add remote video to the page

let selectedColor = 'red';

// Set canvas size
canvas.width = 640;
canvas.height = 480;

// Start local camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please allow camera permissions and ensure your device has a camera.');
  }
}

// Check if the browser supports mediaDevices
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  startCamera();
} else {
  alert('Your browser does not support camera access. Please use a modern browser like Chrome or Firefox.');
}

// Initialize PeerJS with a reliable PeerServer
const peer = new Peer({
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  debug: 3,
});

peer.on('open', (id) => {
  console.log('My ID:', id);
  alert(`Your ID: ${id}. Share this link with your friend: ${window.location.href}?id=${id}`);
});

// Handle incoming connections
peer.on('connection', (conn) => {
  conn.on('data', (data) => {
    drawColor(data.x, data.y, data.color);
  });

  conn.on('error', (error) => {
    console.error('Connection error:', error);
    alert('Connection error. Please try again.');
  });
});

peer.on('call', (call) => {
  // Answer the call with the local video stream
  call.answer(video.srcObject);

  // Handle the remote video stream
  call.on('stream', (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
  });

  call.on('error', (error) => {
    console.error('Call error:', error);
    alert('Call error. Please try again.');
  });
});

peer.on('error', (error) => {
  console.error('PeerJS error:', error);
  alert('PeerJS error. Please refresh the page and try again.');
});

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

  // Send color data to the connected peer
  if (peer.connections.length > 0) {
    peer.connections[0].send({ x, y, color: selectedColor });
  }
});

// Handle connection
connectButton.addEventListener('click', () => {
  const remoteId = remoteIdInput.value;
  if (!remoteId) {
    alert('Please enter a valid ID.');
    return;
  }

  const conn = peer.connect(remoteId);

  conn.on('open', () => {
    console.log('Connected to:', remoteId);
    alert('Connected to the other player!');

    // Call the remote peer with the local video stream
    const call = peer.call(remoteId, video.srcObject);

    // Handle the remote video stream
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });

    call.on('error', (error) => {
      console.error('Call error:', error);
      alert('Call error. Please try again.');
    });
  });

  conn.on('data', (data) => {
    drawColor(data.x, data.y, data.color);
  });

  conn.on('error', (error) => {
    console.error('Connection error:', error);
    alert('Connection error. Please check the ID and try again.');
  });
});

// Function to draw color on the canvas
function drawColor(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI); // Circle radius: 20px
  ctx.fill();
}

// Automatically connect if a peer ID is provided in the URL
const urlParams = new URLSearchParams(window.location.search);
const peerId = urlParams.get('id');
if (peerId) {
  remoteIdInput.value = peerId;
  connectButton.click();
}
