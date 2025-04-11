import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyD-LTOR1aWyDllNQtX5lI3vH586Z__MN-Y",
    authDomain: "caimstudios-d2284.firebaseapp.com",
    projectId: "caimstudios-d2284",
    storageBucket: "caimstudios-d2284.firebasestorage.app",
    messagingSenderId: "59150327616",
    appId: "1:59150327616:web:0ac2ad627dc38e346624a5",
  };
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sign Up
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, {
            displayName: name
        });

        // Store additional user data in Firestore
        await setDoc(doc(db, "Users", user.uid), {
            name: name,
            email: email,
            createdAt: new Date()
        });

        // Store user info in localStorage
        const userInfo = {
            uid: user.uid,
            email: user.email,
            name: name
        };
        localStorage.setItem('user', JSON.stringify(userInfo));

        window.location.href = 'pages/home.html';
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});

// Sign In
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Check for admin credentials
    if (email === 'admin@gmail.com' && password === 'admin') {
        const adminInfo = {
            uid: 'admin',
            email: 'admin',
            name: 'Administrator',
            isAdmin: true
        };
        localStorage.setItem('user', JSON.stringify(adminInfo));
        window.location.href = 'pages/admin.html';
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user info in localStorage
        const userInfo = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            isAdmin: false
        };
        localStorage.setItem('user', JSON.stringify(userInfo));
        window.location.href = 'pages/home.html';
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (user && isLoginPage) {
        const shouldRedirect = sessionStorage.getItem('freshLogin');
        if (shouldRedirect) {
            sessionStorage.removeItem('freshLogin');
            const userInfo = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0]
            };
            localStorage.setItem('user', JSON.stringify(userInfo));
            window.location.href = 'pages/home.html';
        }
    }
});
