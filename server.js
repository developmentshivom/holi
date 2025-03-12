const WebSocket = require('ws');

const server = new WebSocket.Server({ port: process.env.PORT || 3000 });

server.on('connection', (socket) => {
    console.log("New user connected");

    socket.on('message', (message) => {
        console.log(`Received: ${message}`);
        server.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    socket.on('close', () => {
        console.log("User disconnected");
    });
});

console.log("WebSocket server running...");
