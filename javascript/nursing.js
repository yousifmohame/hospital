import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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

// DOM Elements
const departmentSelect = document.getElementById('departmentSelect');
const doctorNameInput = document.getElementById('doctorName');
const floorInput = document.getElementById('itemName');
const genderSelect = document.getElementById('genderSelect');
const submitRequestBtn = document.getElementById('submitRequestBtn');

// Function to populate the department dropdown (if needed)
async function populateDepartmentSelect() {
    try {
        const departmentsRef = collection(db, "departments");
        const querySnapshot = await getDocs(departmentsRef);

        const logosSnapshot = await getDocs(collection(db, "logos"));
        logosSnapshot.forEach(doc => {
            const logoData = doc.data();
            if (logoData.name === "logo1") {
                document.getElementById("logo1").src = logoData.url;
            } else if (logoData.name === "logo2") {
                document.getElementById("logo2").src = logoData.url;
            }
        });

        querySnapshot.forEach((doc) => {
            const department = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // Use document ID as value
            option.text = department.name; // Use department name as text
            departmentSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading departments:", error);
    }
}

// Function to handle form submission
async function submitRequest() {
    const departmentId = departmentSelect.value;
    const departmentName = departmentSelect.options[departmentSelect.selectedIndex].text;
    const doctorName = doctorNameInput.value;
    const floor = floorInput.value;
    const gender = genderSelect.value;

    // Validate inputs
    if (!departmentId || !doctorName || !floor || !gender) {
        alert("Please fill all fields.");
        return;
    }

    // Prepare data to be saved
    const requestData = {
        departmentId,
        departmentName,
        doctorName,
        floor,
        gender,
        status: "pending" // Initial status of the request
    };

    try {
        // Add request to the "nursingRequests" collection in Firestore
        const nursingRequestsRef = collection(db, "nursingRequests");
        await addDoc(nursingRequestsRef, requestData);

        console.log("Request submitted successfully!");
        alert("Your request has been submitted for review.");

        // Clear the form
        departmentSelect.value = "generalAppointments"; // Reset to default
        doctorNameInput.value = "";
        floorInput.value = "";
        genderSelect.value = "male"; // Reset to default
    } catch (error) {
        console.error("Error submitting request:", error);
        alert("An error occurred. Please try again.");
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', populateDepartmentSelect);
submitRequestBtn.addEventListener('click', submitRequest);