// ============================================================================
// VieGeo - Firebase Database Initialization (v10 Compat)
// ============================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDBpAw07ulXZbwXdrt2YbJq2K-JPhidzpU",
    authDomain: "viegeo.firebaseapp.com",
    projectId: "viegeo",
    storageBucket: "viegeo.firebasestorage.app",
    messagingSenderId: "1096962722269",
    appId: "1:1096962722269:web:3ce5e32956ca42a2b9ce34",
    measurementId: "G-D31X0CZR93"
};

// Initialize Firebase using the Compat API so we can use global `firebase` object
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Lấy tham chiếu Firestore và công khai nó cho các script tải sau (map.js,
// learning-path.js). Điều này tránh lỗi scope ngầm khi trang được tải lại.
const db = window.db || firebase.firestore();
window.db = db;
