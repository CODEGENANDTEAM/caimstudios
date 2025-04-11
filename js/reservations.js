import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD-LTOR1aWyDllNQtX5lI3vH586Z__MN-Y",
    authDomain: "caimstudios-d2284.firebaseapp.com",
    projectId: "caimstudios-d2284",
    storageBucket: "caimstudios-d2284.firebasestorage.app",
    messagingSenderId: "59150327616",
    appId: "1:59150327616:web:0ac2ad627dc38e346624a5",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allBookings = []; // Store all bookings

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function renderUserBookings(bookings) {
    const grid = document.getElementById('reservationsGrid');
    grid.innerHTML = '';

    if (bookings.length === 0) {
        document.getElementById('noBookings').style.display = 'block';
        grid.style.display = 'none';
        return;
    }

    document.getElementById('noBookings').style.display = 'none';
    grid.style.display = 'grid';

    // Update the card template in renderUserBookings function
    bookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = `reservation-card status-${booking.status}`;
        card.innerHTML = `
            <div class="reservation-date" style="color: black; font-weight: bold;">${formatDate(booking.date)}</div>
            <div class="reservation-details">
                <div class="detail-row">
                    <span class="detail-label" style="color: black;">Time:</span>
                    <span style="color: var(--text-color)">${booking.timeSlot}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label" style="color: black;">Artist:</span>
                    <span style="color: var(--text-color)">${booking.artist}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label" style="color: black;">Style:</span>
                    <span style="color: var(--text-color)">${booking.tattooStyle}</span>
                </div>
                <div class="detail-row status-row">
                    <span class="detail-label" style="color: black;">Status:</span>
                    <span class="status-badge ${booking.status}">${booking.status}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Update stats
    document.getElementById('totalBookings').textContent = allBookings.length;
    document.getElementById('pendingBookings').textContent = 
        allBookings.filter(b => b.status === 'pending').length;
    document.getElementById('approvedBookings').textContent = 
        allBookings.filter(b => b.status === 'approved').length;
}

// Filter functionality
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const status = btn.getAttribute('data-status');
        if (status === 'all') {
            renderUserBookings(allBookings);
        } else {
            const filtered = allBookings.filter(booking => booking.status === status);
            renderUserBookings(filtered);
        }
    });
});

// Get user's bookings
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
    const q = query(collection(db, "tattooBookings"), where("userId", "==", user.uid));
    onSnapshot(q, (snapshot) => {
        allBookings = [];
        snapshot.forEach((doc) => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });
        renderUserBookings(allBookings);
        
        // Display user name
        document.getElementById('userName').textContent = user.name || user.email;
    });
} else {
    window.location.href = 'index.html';
}