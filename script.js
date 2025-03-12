document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const video = document.getElementById('video');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // ✅ Ensure Firebase is loaded before initializing
    if (typeof firebase !== 'undefined') {
        const firebaseConfig = {
            apiKey: "AIzaSyD9geqCCQlvh725M5aV22hYWUNa2YU6qYM",
            authDomain: "virtual-holi-game.firebaseapp.com",
            databaseURL: "https://virtual-holi-game-default-rtdb.firebaseio.com",
            projectId: "virtual-holi-game",
            storageBucket: "virtual-holi-game.firebasestorage.app",
            messagingSenderId: "348578981043",
            appId: "1:348578981043:web:78126b6e1605efab6afcc6",
            measurementId: "G-9B3T81ZSR8"
        };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        // ✅ Get webcam feed
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then((stream) => { video.srcObject = stream; })
            .catch((error) => console.error('Error accessing webcam:', error));

        // ✅ Handle click to draw
        canvas.addEventListener('click', (e) => {
            const x = e.clientX / canvas.width;
            const y = e.clientY / canvas.height;
            const color = '#' + Math.floor(Math.random() * 16777215).toString(16);

            // ✅ Send drawing data to Firebase
            db.ref('drawings').push({ x, y, color });
        });

        // ✅ Draw received data
        db.ref('drawings').on('child_added', (snapshot) => {
            const { x, y, color } = snapshot.val();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x * canvas.width, y * canvas.height, 10, 0, 2 * Math.PI);
            ctx.fill();
        });
    } else {
        console.error('Firebase SDK not loaded');
    }
});
