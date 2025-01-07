import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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

// Get department name and ID from URL
const urlParams = new URLSearchParams(window.location.search);
const departmentName = urlParams.get('choice'); // Use 'choice' as that's what was passed from the previous page
const departmentId = urlParams.get('departmentId');

// Set department name on the page
document.getElementById('departmentName').textContent = departmentName;

let selectedChoice = null;
let selectedChoiceId = null; // To store the ID of the selected choice

// Function to load items from the selected department's sub-collection
async function loadSubCollectionData() {
    const choicesContainer = document.getElementById("choises");
    choicesContainer.innerHTML = ""; // Clear existing choices

    // Fetch items from the department's sub-collection
    const subCollectionRef = collection(db, "department", departmentId, departmentName);

    try {
        const querySnapshot = await getDocs(subCollectionRef);
        querySnapshot.forEach((doc) => {
            const itemData = doc.data();
            const div = document.createElement("div");
            div.className = "one";
            div.textContent = itemData.itemName; // Display the item name

            div.addEventListener('click', () => {
                // Highlight the selected choice
                const choices = document.querySelectorAll('.choise .one');
                choices.forEach(c => c.style.backgroundColor = ''); // Reset background color
                div.style.backgroundColor = '#D3D3D3'; // Highlight selected choice

                // Update selected choice name and ID
                selectedChoice = itemData.itemName;
                selectedChoiceId = doc.id; // Store the document ID of the selected item
            });

            choicesContainer.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading sub-collection data:", error);
        alert("Error loading items. See console for details.");
    }
}

// Load data on page load
loadSubCollectionData();

// Event listener for "Next" button
document.getElementById('nextBtn').addEventListener('click', () => {
    if (selectedChoice && selectedChoiceId) {
        // Encode the selected choice name and ID in the URL
        const url = `section.html?departmentName=${encodeURIComponent(departmentName)}&departmentId=${departmentId}&selectedChoice=${encodeURIComponent(selectedChoice)}`;
        window.location.href = url;
    } else {
        alert('Please select an item before proceeding.');
    }
});