// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

// Firebase Configuration
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
const db = getFirestore(app);
const auth = getAuth(app); // Add this line

// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    window.location.href = '../index.html';
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('user');
        sessionStorage.clear(); // Clear any session data
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
});

// Handle Form Submission
// Add this function to check available time slots
// Modify the checkAvailableTimeSlots function to include artist
// Modify the option reset in checkAvailableTimeSlots
async function checkAvailableTimeSlots(selectedDate, selectedArtist) {
    const timeSlotSelect = document.getElementById('timeSlot');
    const options = timeSlotSelect.getElementsByTagName('option');
    
    try {
        // Reset all options to original state
        Array.from(options).forEach(option => {
            option.disabled = false;
            option.style.color = '';
            // Remove (Booked) suffix if present
            option.textContent = option.value.replace(/ \(\d+-\d+\)/, '');
        });

        const q = query(collection(db, "tattooBookings"), 
            where("date", "==", selectedDate),
            where("artist", "==", selectedArtist), // Add artist filter
            where("status", "in", ["pending", "approved"]));
        const querySnapshot = await getDocs(q);
        
        // Disable booked time slots
        querySnapshot.forEach((doc) => {
            const booking = doc.data();
            Array.from(options).forEach(option => {
                if(option.value === booking.timeSlot) {
                    option.disabled = true;
                    option.style.color = '#666';
                    option.textContent = `${option.textContent} (Booked)`;
                }
            });
        });
    } catch (error) {
        console.error("Error checking time slots:", error);
    }
}

// Add event listener for date change
// Update date change event listener to include artist
document.getElementById('date').addEventListener('change', (e) => {
    const selectedArtist = document.getElementById('artist').value;
    checkAvailableTimeSlots(e.target.value, selectedArtist);
});

// Add artist change event listener
document.getElementById('artist').addEventListener('change', (e) => {
    const selectedDate = document.getElementById('date').value;
    if(selectedDate) checkAvailableTimeSlots(selectedDate, e.target.value);
});

// Update form submission validation
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedDate = document.getElementById('date').value;
    const selectedTime = document.getElementById('timeSlot').value;
    const selectedArtist = document.getElementById('artist').value;
    
    // Update query to check artist-specific availability
    const q = query(collection(db, "tattooBookings"), 
        where("date", "==", selectedDate),
        where("timeSlot", "==", selectedTime),
        where("artist", "==", selectedArtist),
        where("status", "in", ["pending", "approved"]));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        alert('Sorry, this time slot has just been booked. Please select another time.');
        // Add missing artist parameter here
        checkAvailableTimeSlots(selectedDate, selectedArtist); // This line was missing the artist
        return;
    }

    // Call this when the page loads if date is pre-selected
    const dateInput = document.getElementById('date');
    const artistInput = document.getElementById('artist');
    if (dateInput.value) {
        checkAvailableTimeSlots(dateInput.value, artistInput.value);
    }
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Please login to make a booking');
        window.location.href = '../index.html';
        return;
    }

    const formData = {
        artist: document.getElementById('artist').value,
        tattooStyle: document.getElementById('tattooStyle').value,
        date: document.getElementById('date').value,
        timeSlot: document.getElementById('timeSlot').value,
        status: 'pending',
        email: user.email,
        username: user.name || user.email.split('@')[0], // Fallback to email username if name not available
        userId: user.uid,
        timestamp: new Date().toISOString()
    };

    try {
        // Validate all required fields are present
        if (!formData.artist || !formData.tattooStyle || !formData.date || !formData.timeSlot) {
            throw new Error('Please fill in all required fields');
        }

        await addDoc(collection(db, "tattooBookings"), formData);
        alert('Booking submitted successfully! Check your reservations page for status.');
        window.location.href = 'reservations.html';
    } catch (error) {
        console.error("Error adding booking: ", error);
        alert('Error submitting booking: ' + error.message);
    }
});