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

async function loadSubCollectionData() {
    const choicesContainer = document.getElementById("choises");
    choicesContainer.innerHTML = ""; // Clear existing choices

    // Fetch items from the department's sub-collection
    const subCollectionRef = collection(db, "department", departmentId, departmentName);

    try {
        const logosSnapshot = await getDocs(collection(db, "logos"));
        logosSnapshot.forEach(doc => {
            const logoData = doc.data();
            if (logoData.name === "logo1") {
                document.getElementById("logo1").src = logoData.url;
            } else if (logoData.name === "logo2") {
                document.getElementById("logo2").src = logoData.url;
            }
        });

        const querySnapshot = await getDocs(subCollectionRef);
        querySnapshot.forEach((doc) => {
            const itemData = doc.data();
            const div = document.createElement("div");
            div.className = "one";
            div.textContent = itemData.itemName; // Display the item name

            div.addEventListener('click', () => {
                // Redirect to the desired page
                const url = `section.html?departmentName=${encodeURIComponent(departmentName)}&departmentId=${departmentId}&selectedChoice=${encodeURIComponent(itemData.itemName)}`;
                window.location.href = url;
            });

            choicesContainer.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading sub-collection data:", error);
        alert("Error loading items. See console for details.");
    }
}

loadSubCollectionData();