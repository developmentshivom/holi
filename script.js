const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const remoteIdInput = document.getElementById('remote-id');
const connectButton = document.getElementById('connect');
let selectedColor = 'red';

// Set canvas size
canvas.width = 640;
canvas.height = 480;

// Initialize PeerJS
const peer = new Peer();

peer.on('open', (id) => {
  console.log('My ID:', id);
  alert(`Your ID: ${id}. Share this with your friend to connect.`);
});

peer.on('connection', (conn) => {
  conn.on('data', (data) => {
    drawColor(data.x, data.y, data.color);
  });
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
  const conn = peer.connect(remoteId);

  conn.on('open', () => {
    console.log('Connected to:', remoteId);
    alert('Connected to the other player!');
  });

  conn.on('data', (data) => {
    drawColor(data.x, data.y, data.color);
  });
});

// Function to draw color on the canvas
function drawColor(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI); // Circle radius: 20px
  ctx.fill();
}
