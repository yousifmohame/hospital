import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    updateDoc,
    setDoc,
    getDoc,
    runTransaction,
    addDoc,
    query,
    orderBy,
    limit,
    where,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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

// Get data from URL
const urlParams = new URLSearchParams(window.location.search);
const departmentName = urlParams.get("departmentName");
const departmentId = urlParams.get("departmentId");
const selectedChoice = urlParams.get("selectedChoice");

// Set text on the page
document.getElementById("departmentName").textContent = departmentName;
document.getElementById("selectedChoice").textContent = selectedChoice;

// Function to load services from Firestore
let selectedService = null; // Variable to track the selected service

async function loadServices() {
    const dataList = document.getElementById("dataList");
    dataList.innerHTML = ""; // Clear existing data

    const collectionRef = collection(db, "services", departmentId, selectedChoice);

    try {
        const logosSnapshot = await getDocs(collection(db, "logos"));
        logosSnapshot.forEach((doc) => {
            const logoData = doc.data();
            if (logoData.name === "logo1") {
                document.getElementById("logo1").src = logoData.url;
            } else if (logoData.name === "logo2") {
                document.getElementById("logo2").src = logoData.url;
            }
        });

        const querySnapshot = await getDocs(collectionRef);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const listItem = document.createElement("div");
            listItem.className = "one";

            listItem.innerHTML = `
                <strong>${data.serviceName}</strong>
            `;

            // Add click event listener
            listItem.addEventListener("click", async () => {
                selectedService = { id: doc.id, data: data };

                // Immediately proceed when a service is clicked
                await handleNext();
            });

            dataList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error loading services:", error);
    }
}

// Function to get the current queue length for a specific department
async function getQueueLength(departmentId) {
    const queueRef = doc(db, "queue", departmentId);
    const queueSnap = await getDoc(queueRef);
    if (queueSnap.exists()) {
        return (queueSnap.data().queue || []).length;
    } else {
        return 0;
    }
}

// Function to update the displayed queue length
async function updateQueueLengthDisplay(departmentId) {
    const queueLength = await getQueueLength(departmentId);
    document.getElementById("queueLength").textContent = queueLength;
}

// Function to handle the "Next" action
async function handleNext() {
    // Hide the service selection area and show the location info box
    document.getElementById("serviceSelection").style.display = "none";
    document.getElementById("locationInfoBox").style.display = "block";

    try {
        // Load existing location information for the selectedChoice
        const locationInfoRef = doc(db, "locationInfo", departmentId, "choices", selectedChoice);
        const locationInfoSnap = await getDoc(locationInfoRef);

        if (locationInfoSnap.exists()) {
            document.getElementById("locationInfo").innerHTML = locationInfoSnap.data().info;
        } else {
            document.getElementById("locationInfo").innerHTML = "No location information available.";
        }
    } catch (error) {
        console.error("Error fetching location information:", error);
    }
}

// Function to handle the "Update Location" action
async function handleUpdateLocation() {
    const locationInfo = document.getElementById("locationInfo").value;

    if (!locationInfo) {
        alert("Please enter location information.");
        return;
    }

    try {
        // Update location information for the selectedChoice
        const locationInfoRef = doc(db, "locationInfo", departmentId, "choices", selectedChoice);
        await setDoc(locationInfoRef, { info: locationInfo }, { merge: true });

        alert("Location information updated successfully!");
    } catch (error) {
        console.error("Error updating location information:", error);
        alert("Error updating location information. Please try again.");
    }
}

// Function to get the next waiting number for a specific department
async function getNextWaitingNumber(departmentId) {
    const queueNumberRef = doc(db, "queueNumbers", departmentId);

    try {
        // Use a transaction to ensure atomicity
        const newNumber = await runTransaction(db, async (transaction) => {
            const queueNumberDoc = await transaction.get(queueNumberRef);

            let lastNumber = 0;
            if (queueNumberDoc.exists()) {
                lastNumber = queueNumberDoc.data().lastNumber || 0;
            }

            const newNumber = lastNumber + 1;
            transaction.set(queueNumberRef, { lastNumber: newNumber }, { merge: true });

            return newNumber;
        });

        console.log(`Assigned queue number ${newNumber} for department ${departmentId}`);
        return newNumber;
    } catch (error) {
        console.error("Error assigning queue number:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

// Function to confirm the reservation
async function confirmReservation() {
    try {
        // Get the next waiting number for the department
        const waitingNumber = await getNextWaitingNumber(departmentId);

        // Fetch location information for the selectedChoice
        const locationInfoRef = doc(db, "locationInfo", departmentId, "choices", selectedChoice);
        const locationInfoSnap = await getDoc(locationInfoRef);
        const locationInfo = locationInfoSnap.exists() ? locationInfoSnap.data().info : "No location information";

        // Use a transaction to ensure atomic updates
        const currentQueue = await runTransaction(db, async (transaction) => {
            const queueRef = doc(db, "queue", departmentId);
            const queueSnap = await transaction.get(queueRef);
            let currentQueue = [];

            if (queueSnap.exists()) {
                currentQueue = queueSnap.data().queue || [];
            }

            // Add the user's reservation to the queue with a placeholder for userName
            currentQueue.push({
                userId: "placeholder", // Placeholder for user ID
                departmentId: departmentId,
                departmentName: departmentName,
                selectedChoice: selectedChoice,
                selectedItem: selectedService,
                waitingNumber: waitingNumber,
                status: "تم البدأ",
                locationInfo: locationInfo, // Include location information
            });

            // Update the queue in Firestore
            transaction.set(queueRef, { queue: currentQueue });

            // Return currentQueue to use it after the transaction completes
            return currentQueue;
        });

        // Prompt for the user's name after the transaction is completed
        const userName = "welcome";
        if (!userName) {
            alert("Reservation process incomplete. Name is required.");
            return;
        }

        // Update the placeholder with the actual user name
        const queueRef = doc(db, "queue", departmentId);
        const queueSnap = await getDoc(queueRef);
        if (queueSnap.exists()) {
            let updatedQueue = queueSnap.data().queue || [];
            const userIndex = updatedQueue.findIndex((item) => item.waitingNumber === waitingNumber);
            if (userIndex !== -1) {
                updatedQueue[userIndex].userId = userName; // Update the placeholder with the actual user name
                await updateDoc(queueRef, { queue: updatedQueue });
            }
        }

        // Add a new document to the 'waiting' collection
        const waitingRef = collection(db, "waiting");
        await addDoc(waitingRef, {
            numberInWaiting: waitingNumber,
            name: userName,
            departmentName: departmentName,
            departmentId: departmentId,
            selectedChoice: selectedChoice,
            peopleInWaiting: currentQueue.length, // Update the count of people in waiting
            locationInfo: locationInfo, // Include location information
        });

        // Create order data
        const orderData = {
            userId: userName,
            departmentId: departmentId,
            departmentName: departmentName,
            selectedChoice: selectedChoice,
            selectedService: selectedService.data.serviceName,
            waitingNumber: waitingNumber,
            status: "تم البدأ",
            locationInfo: locationInfo, // Include location information
            createdAt: new Date(),
        };

        // Add the order to the 'orders' collection
        const ordersRef = collection(db, "orders");
        await addDoc(ordersRef, orderData);

        console.log("Order added to 'orders' collection successfully!");

        // Show waiting information
        document.getElementById("locationInfoBox").style.display = "none";
        document.getElementById("waitingInfo").style.display = "block";

        // Update the waiting information on the page
        document.getElementById("waitingNumber").textContent = waitingNumber;
        document.getElementById("queueLength").textContent = currentQueue.length;

        // Redirect to the waiting page with necessary data
        window.location.href = `waiting.html?departmentId=${departmentId}&waitingNumber=${waitingNumber}`;
    } catch (error) {
        console.error("Error during transaction:", error);
        alert("An error occurred while processing your reservation. Please try again.");
    }
}

// Load services on page load
loadServices();

// Add event listeners
document.getElementById("finishBtn").addEventListener("click", confirmReservation);
document.getElementById("updateLocationBtn").addEventListener("click", handleUpdateLocation);

// Update queue length initially and every 30 seconds
updateQueueLengthDisplay(departmentId);
setInterval(() => updateQueueLengthDisplay(departmentId), 30000);