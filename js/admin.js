import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, onSnapshot, query, where,getDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";


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
const auth = getAuth(app); // Add this line



// Update statistics
function updateStats(bookings) {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const approved = bookings.filter(b => b.status === 'approved').length;

    document.getElementById('totalBookings').textContent = total;
    document.getElementById('pendingBookings').textContent = pending;
    document.getElementById('approvedBookings').textContent = approved;
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

// Update booking status
// Add this near the top of your file after Firebase initialization
emailjs.init("5ZTuE1fT-3fX_IDhR"); // Replace with your actual public key

// Update the updateBookingStatus function
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const bookingRef = doc(db, "tattooBookings", bookingId);
        const bookingDoc = await getDoc(bookingRef);
        const bookingData = bookingDoc.data();
        
        // Update booking status in Firestore
        await updateDoc(bookingRef, {
            status: newStatus
        });

        // Check if email exists and is not empty
        if (bookingData.email && bookingData.email.trim() !== '') {
            try {
                // EmailJS requires specific parameter names for recipients
                // The key issue is that EmailJS expects a specific parameter name for the recipient
                const templateParams = {
                    email: bookingData.email,
                    from_name: "Caim Studios",
                    to_name: bookingData.username || "Customer",
                    booking_date: formatDate(bookingData.date),
                    booking_time: bookingData.timeSlot,
                    booking_status: newStatus,
                    artist_name: bookingData.artist,
                    // This is the critical part - EmailJS needs these specific parameters:
                    to: bookingData.email,  // Try 'to' instead of 'user_email'
                    recipient: bookingData.email  // Try 'recipient' as well
                };
                
                await emailjs.send(
                    "service_a688pms",
                    "template_grwq5ul",
                    templateParams
                );
                
                alert(`Booking ${newStatus} successfully! Email notification sent.`);
            } catch (emailError) {
                console.error("Email sending failed:", emailError);
                
                // Since email is failing, let's just update the status without email
                alert(`Booking ${newStatus} successfully! (Email notification could not be sent)`);
            }
        } else {
            alert(`Booking ${newStatus} successfully!`);
        }
        
        // Refresh the page
        location.reload();
    } catch (error) {
        console.error("Error updating booking: ", error);
        alert("Error updating booking status");
    }
}

// Render bookings table
function renderBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    tbody.innerHTML = '';

    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(booking.date)}</td>
            <td>${booking.timeSlot}</td>
            <td>${booking.username}</td>
            <td>${booking.artist}</td>
            <td>${booking.tattooStyle}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
            <td class="action-buttons">
                ${booking.status === 'pending' ? `
                    <button class="btn btn-approve" onclick="updateBookingStatus('${booking.id}', 'approved')">Approve</button>
                    <button class="btn btn-reject" onclick="updateBookingStatus('${booking.id}', 'rejected')">Reject</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter bookings
document.getElementById('statusFilter').addEventListener('change', (e) => {
    const status = e.target.value;
    let q = collection(db, "tattooBookings");
    
    if (status !== 'all') {
        q = query(q, where("status", "==", status));
    }

    onSnapshot(q, (snapshot) => {
        const bookings = [];
        snapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        renderBookings(bookings);
        updateStats(bookings);
    });
});

// Initial load
const q = collection(db, "tattooBookings");
onSnapshot(q, (snapshot) => {
    const bookings = [];
    snapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
    });
    renderBookings(bookings);
    updateStats(bookings);
});

// Make updateBookingStatus available globally
window.updateBookingStatus = updateBookingStatus;

// Update the logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
});


// Add click handler for navigation
// Remove the duplicate event listener and combine the functionality
document.querySelector('nav').addEventListener('click', async (e) => {
    const dashboardContent = document.querySelector('.header-content');
    const bookingsSection = document.querySelector('.bookings-section');
    const chartsSection = document.querySelector('#charts-dashboard');
    
    if (e.target.closest('a[href="#bookings"]')) {
        e.preventDefault();
        document.querySelector('li.active').classList.remove('active');
        e.target.closest('li').classList.add('active');
        
        dashboardContent.style.display = 'none';
        bookingsSection.style.display = 'none';
        chartsSection.style.display = 'block';
        
        // Initialize charts
        await initializeCharts();
    } else if (e.target.closest('a[href="#dashboard"]')) {
        e.preventDefault();
        document.querySelector('li.active').classList.remove('active');
        e.target.closest('li').classList.add('active');
        
        dashboardContent.style.display = 'block';
        bookingsSection.style.display = 'block';
        chartsSection.style.display = 'none';
    }
});

async function initializeCharts() {
    // Clear existing charts if any
    const charts = Chart.getChart('artistChart');
    if (charts) charts.destroy();

    const bookingsRef = collection(db, "tattooBookings");
    const bookingsSnapshot = await getDocs(bookingsRef);
    const bookings = [];
    bookingsSnapshot.forEach(doc => bookings.push(doc.data()));

    // Artist Chart
    const artists = [...new Set(bookings.map(b => b.artist))];
    const artistData = {
        labels: artists,
        datasets: [{
            label: 'Bookings by Artist',
            data: artists.map(artist => 
                bookings.filter(b => b.artist === artist).length
            ),
            backgroundColor: '#C38A5D'
        }]
    };

    // Create Artist Chart
    new Chart(document.getElementById('artistChart'), {
        type: 'bar',
        data: artistData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Status Chart
    const statusData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            data: [
                bookings.filter(b => b.status === 'pending').length,
                bookings.filter(b => b.status === 'approved').length,
                bookings.filter(b => b.status === 'rejected').length
            ],
            backgroundColor: ['#ffd700', '#4CAF50', '#f44336']
        }]
    };

    // Style Chart
    const styles = [...new Set(bookings.map(b => b.tattooStyle))];
    const styleData = {
        labels: styles,
        datasets: [{
            label: 'Bookings by Style',
            data: styles.map(style => 
                bookings.filter(b => b.tattooStyle === style).length
            ),
            backgroundColor: '#C38A5D'
        }]
    };

    // Timeline Chart
    const dates = [...new Set(bookings.map(b => b.date))].sort();
    const timelineData = {
        labels: dates.map(date => new Date(date).toLocaleDateString()),
        datasets: [{
            label: 'Bookings per Day',
            data: dates.map(date => 
                bookings.filter(b => b.date === date).length
            ),
            borderColor: '#C38A5D',
            fill: false
        }]
    };

    // Common chart options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#f5f0e1',
                    font: {
                        size: 14
                    }
                }
            }
        }
    };
    
    // For bar and line charts
    const scaleOptions = {
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(195, 138, 93, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#f5f0e1'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#f5f0e1'
                }
            }
        }
    };
    
    // Update chart configurations
    new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: statusData,
        options: {
            ...commonOptions,
            cutout: '70%',
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            }
        }
    });
    
    new Chart(document.getElementById('styleChart'), {
        type: 'bar',
        data: styleData,
        options: {
            ...commonOptions,
            ...scaleOptions,
            plugins: {
                ...commonOptions.plugins
            },
            borderRadius: 8
        }
    });

    new Chart(document.getElementById('timelineChart'), {
        type: 'line',
        data: timelineData,
        options: {
            ...commonOptions,
            ...scaleOptions,
            plugins: {
                ...commonOptions.plugins
            },
            tension: 0.4,
            fill: true
        }
    });
}

// Update navigation handler
document.querySelector('nav').addEventListener('click', async (e) => {
    const dashboardView = document.getElementById('dashboard-view');
    const chartsView = document.getElementById('charts-view');
    
    if (e.target.closest('a[href="#bookings"]')) {
        e.preventDefault();
        document.querySelector('li.active').classList.remove('active');
        e.target.closest('li').classList.add('active');
        
        dashboardView.style.display = 'none';
        chartsView.style.display = 'block';
        await initializeCharts();
    } else if (e.target.closest('a[href="#dashboard"]')) {
        e.preventDefault();
        document.querySelector('li.active').classList.remove('active');
        e.target.closest('li').classList.add('active');
        
        dashboardView.style.display = 'block';
        chartsView.style.display = 'none';
    }
});