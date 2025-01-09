// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, runTransaction, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-messaging.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAA1NB3xLMUvAGg1ni4m1JK_qrI96CSnGI",
    authDomain: "filmy-6bd1a.firebaseapp.com",
    projectId: "filmy-6bd1a",
    storageBucket: "filmy-6bd1a.appspot.com",
    messagingSenderId: "409354230199",
    appId: "1:409354230199:web:978e2be5c80f52a197b032",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Get data from URL
const urlParams = new URLSearchParams(window.location.search);
const departmentId = urlParams.get('departmentId');
const waitingNumber = parseInt(urlParams.get('waitingNumber'));

// Request Notification Permission
function requestNotificationPermission() {
    Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
        } else {
            console.log('Notification permission denied.');
        }
    });
}

// Call this function before trying to send a notification
requestNotificationPermission();

// Register Service Worker and Get FCM Token
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);

            // Check notification permission status
            if (Notification.permission === 'granted') {
                getFCMToken(registration);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        getFCMToken(registration);
                    } else {
                        console.log('Notification permission denied.');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
}

// Get FCM Token
function getFCMToken(registration) {
    getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BHVjbcSzFCOBM09yA4Rh70z_s41-HCrNDzaC1NfkF9bLGvvdPAHd4tGFOAff_dpKI2H93GriDodpW_9g1xxPaM8'
    })
        .then(currentToken => {
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                localStorage.setItem('fcmToken', currentToken);
                // Save the token to your backend (e.g., Firestore)
                saveTokenToBackend(currentToken);
            } else {
                console.log('Failed to get FCM token.');
            }
        })
        .catch(error => {
            console.error('Error getting FCM token:', error);
        });
}

// Save FCM Token to Backend (Firestore)
async function saveTokenToBackend(token) {
    const userId = "USER_ID"; // Replace with the actual user ID
    const tokenRef = doc(db, "fcmTokens", userId);
    await setDoc(tokenRef, { token: token }, { merge: true });
    console.log("FCM token saved to backend.");
}

// Listen for Foreground Messages
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png'
    };

    // Show the notification
    navigator.serviceWorker.getRegistration()
        .then(registration => {
            if (registration) {
                registration.showNotification(notificationTitle, notificationOptions);
            }
        });
});

// Function to Start Listening for Order Status Changes
function startOrderStatusListener(userId, waitingNumber, departmentId, selectedChoice) {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef,
        where("waitingNumber", "==", waitingNumber),
        where("departmentId", "==", departmentId),
        where("selectedChoice", "==", selectedChoice)
    );

    // Use a flag to track if the listener is already set up
    if (!window.orderStatusListenerActive) {
        window.orderStatusListenerActive = true;

        onSnapshot(q, (querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const order = change.doc.data();
                    if (order && order.status) {
                        const status = order.status;
                        console.log("Order Status Changed:", status);

                        // Trigger local notification when order status changes
                        if (Notification.permission === "granted") {
                            new Notification("Order Status Updated", {
                                body: `تم تحديث حالة الطلب الي: ${status}`,
                                icon: 'https://firebasestorage.googleapis.com/v0/b/filmy-6bd1a.appspot.com/o/logos%2Flogo2.png?alt=media&token=85c04fe3-40dc-46df-8b01-9df78d6d2c1e',
                            });
                        } else {
                            console.log("Notification permission not granted.");
                        }

                        // Re-render the order status levels with the updated status
                        renderOrderStatus(userId, waitingNumber, departmentId, selectedChoice);
                    }
                }
            });
        });
    }
}

// Function to Display Waiting Information
async function displayWaitingInfo(queueData) {
    if (!queueData || !queueData.queue) return;

    const waitingInfo = document.getElementById('waitingInfo');
    const departmentNameEl = document.getElementById('departmentName');
    const waitingNumberEl = document.getElementById('waitingNumber');
    const queueLengthEl = document.getElementById('queueLength');
    const selectedChoiceEl = document.getElementById('selectedChoice');
    const selectedServiceEl = document.getElementById('selectedService');

    // Find the user's position in the queue
    const userIndex = queueData.queue.findIndex(item => item.waitingNumber === waitingNumber);
    if (userIndex === -1) {
        waitingInfo.style.display = 'none'; // Hide if user not found
        return;
    }

    // Get the user's data from the queue
    const userData = queueData.queue[userIndex];

    // Display the user's information
    departmentNameEl.textContent = userData.departmentName;
    waitingNumberEl.textContent = waitingNumber;
    queueLengthEl.textContent = userIndex;
    selectedChoiceEl.textContent = userData.selectedChoice;
    selectedServiceEl.textContent = userData.selectedItem.data.serviceName;

    waitingInfo.style.display = 'block';
}

// Function to Get Order Status from Firestore
async function getOrderStatus(userId, waitingNumber, departmentId, selectedChoice) {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef,
        where("userId", "==", userId),
        where("waitingNumber", "==", waitingNumber),
        where("departmentId", "==", departmentId),
        where("selectedChoice", "==", selectedChoice)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0];
        const status = orderDoc.data().status;
        return status || null; // Return null if status is missing
    } else {
        return null; // Return null if no order found
    }
}

// Function to Render Order Status Levels
async function renderOrderStatus(userId, waitingNumber, departmentId, selectedChoice) {
    const orderStatusEl = document.getElementById('orderStatus');
    orderStatusEl.innerHTML = ''; // Clear previous status

    const statusLevels = [
        "تم البدأ",
        "الاستقبال للتسجيل",
        "فحص مبدئي",
        "العيادة",
        "انتهاء الخدمة",
    ];

    // Fetch the current status from Firestore
    const currentStatus = await getOrderStatus(userId, waitingNumber, departmentId, selectedChoice);

    // Render each status level
    statusLevels.forEach((level) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level';
        if (level === currentStatus) {
            levelDiv.classList.add('active'); // Add 'active' class to the current status
        }
        levelDiv.textContent = level;
        orderStatusEl.appendChild(levelDiv);
    });
}

// Function to Handle Finished Orders
async function handleFinishedOrder(departmentId, waitingNumber) {
    try {
        const result = await runTransaction(db, async (transaction) => {
            const queueRef = doc(db, "queue", departmentId);
            const queueSnap = await transaction.get(queueRef);
            if (queueSnap.exists()) {
                let queueData = queueSnap.data().queue;

                // Find and remove the user with the specific waitingNumber
                const userIndex = queueData.findIndex(item => item.waitingNumber === waitingNumber);
                if (userIndex !== -1) {
                    queueData.splice(userIndex, 1); // Remove the user

                    // Update the queue in Firestore
                    transaction.update(queueRef, { queue: queueData });

                    console.log(`User with waiting number ${waitingNumber} removed from the queue.`);
                    return true; // Indicate successful removal
                } else {
                    console.error("User not found in the queue.");
                    return false;
                }
            } else {
                console.error("Queue document not found.");
                return false;
            }
        });

        if (result) {
            // Handle successful removal (e.g., update UI if needed)
        }

    } catch (error) {
        console.error("Error handling finished order:", error);
    }
}

// Listen for Queue Updates
const queueRef = doc(db, "queue", departmentId);

try {
    onSnapshot(queueRef, async (doc) => {
        if (!doc.exists()) {
            console.error("Queue document does not exist.");
            document.getElementById('waitingInfo').style.display = 'none';
            return;
        }

        const queueData = doc.data();
        if (!queueData || !Array.isArray(queueData.queue)) {
            console.error("Malformed queue data:", queueData);
            document.getElementById('waitingInfo').style.display = 'none';
            return;
        }

        displayWaitingInfo(queueData);

        const userIndex = queueData.queue.findIndex(item => item && item.waitingNumber === waitingNumber);
        if (userIndex === -1) {
            console.error("User not found in the queue.");
            return;
        }

        const userData = queueData.queue[userIndex];

        // Fetch initial order status
        const initialOrderStatus = await getOrderStatus(userData.userId, waitingNumber, departmentId, userData.selectedChoice);

        // Render the order status levels with the active status highlighted
        await renderOrderStatus(userData.userId, waitingNumber, departmentId, userData.selectedChoice);

        // Start listening for order status changes
        startOrderStatusListener(userData.userId, waitingNumber, departmentId, userData.selectedChoice);

        // Handle finished order
        if (initialOrderStatus === "انتهاء الخدمة") {
            handleFinishedOrder(departmentId, waitingNumber);
        }
    });
} catch (error) {
    console.error("Error in onSnapshot listener:", error);
}