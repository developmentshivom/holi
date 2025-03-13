// Get a reference to the Firebase Realtime Database
const database = firebase.database();

// Example: Write to Firebase
database.ref("test").set({ message: "Hello, Firebase!" })
    .then(() => console.log("✅ Data written successfully"))
    .catch(error => console.error("❌ Error writing data:", error));

// Example: Read from Firebase
database.ref("test").on("value", snapshot => {
    console.log("📡 Data from Firebase:", snapshot.val());
});
