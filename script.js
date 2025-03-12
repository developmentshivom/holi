const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Suppress MediaPipe warnings
console.disableYellowBox = true;

// WebSocket connection
function connectWebSocket() {
  const ws = new WebSocket('wss://virtual-holi-ws.onrender.com');

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed. Reconnecting...');
    setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
  };

  return ws;
}

const ws = connectWebSocket();

// MediaPipe Face Mesh setup
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

faceMesh.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawLandmarks(landmarks);
    }
  }
});

// Start camera
const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();

// Color throwing
document.querySelectorAll('.colors button').forEach((button) => {
  button.addEventListener('click', () => {
    const color = button.getAttribute('data-color');
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'color', color }));
    } else {
      console.error('WebSocket is not open');
    }
  });
});

// Handle incoming WebSocket messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'color') {
    applyColor(data.color);
  }
};

// Apply color to the face
function applyColor(color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(320, 240, 50, 0, 2 * Math.PI); // Example: Draw a circle on the face
  ctx.fill();
}

// Draw face landmarks (optional)
function drawLandmarks(landmarks) {
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const landmark of landmarks) {
    ctx.lineTo(landmark.x * canvas.width, landmark.y * canvas.height);
  }
  ctx.stroke();
}
