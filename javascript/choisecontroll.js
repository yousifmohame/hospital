import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

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
const storage = getStorage(app);

// Get department name and ID from URL
const urlParams = new URLSearchParams(window.location.search);
const departmentName = urlParams.get('choice');
const departmentId = urlParams.get('departmentId');
let selectedChoice = null; // Variable to store the currently selected choice


// Display department name on the page
document.getElementById('departmentName').textContent = departmentName;

// Function to add data to the department's sub-collection
async function addItemToSubCollection() {
    const newItemInput = document.getElementById('newItemInput').value.trim();
    if (newItemInput) {
        // Use departmentName as the sub-collection name
        const subCollectionRef = collection(db, "department", departmentId, departmentName);

        try {
            // Add the new item to the sub-collection
            await addDoc(subCollectionRef, {
                itemName: newItemInput // Customize the field name as needed
            });

            console.log("Item added to sub-collection successfully!");
            document.getElementById('newItemInput').value = ''; // Clear the input

            // Refresh the displayed data
            loadSubCollectionData();
        } catch (error) {
            console.error("Error adding item to sub-collection:", error);
        }
    }
}

// Function to load data from the department's sub-collection
async function loadSubCollectionData() {
    const dataList = document.getElementById('dataList');
    dataList.innerHTML = ''; // Clear existing data

    // Use departmentName as the sub-collection name
    const subCollectionRef = collection(db, "department", departmentId, departmentName);

    try {
        const querySnapshot = await getDocs(subCollectionRef);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const listItem = document.createElement('div');
            listItem.className = 'one';
            listItem.textContent = data.itemName; // Assuming you have an 'itemName' field
            listItem.addEventListener('click', () => {
                // Highlight selected choice and store its text content
                const choices = document.querySelectorAll('.choise .one');
                choices.forEach(c => c.style.backgroundColor = ''); // Reset background color
                listItem.style.backgroundColor = '#D3D3D3'; // Highlight selected choice
                selectedChoice = listItem.textContent; // Store selected choice
            });
            dataList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error loading sub-collection data:", error);
    }
}

// Event listener for adding an item
document.getElementById('addItemBtn').addEventListener('click', addItemToSubCollection);

// Load data from the department's sub-collection on page load
loadSubCollectionData();

// Event listener for "Next" button
document.getElementById('nextBtn').addEventListener('click', () => {
    if (departmentName && departmentId && selectedChoice) {
        // Encode the selected choice in the URL
        const encodedChoice = encodeURIComponent(selectedChoice);
        const url = `section.html?departmentName=${departmentName}&departmentId=${departmentId}&selectedChoice=${encodedChoice}`;
        window.location.href = url;
    } else {
        alert('Please select an item before proceeding.');
    }
});