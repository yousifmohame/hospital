import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc,  doc, setDoc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
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
// Function to load data from the department's sub-collection
async function loadSubCollectionData() {
    const dataList = document.getElementById('dataList');
    dataList.innerHTML = ''; // Clear existing data

    // Use departmentName as the sub-collection name
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
            const data = doc.data();
            const listItem = document.createElement('div');
            listItem.className = 'one';
            listItem.textContent = data.itemName; // Assuming you have an 'itemName' field
            
            // Create the remove link
            const removeLink = document.createElement('a');
            removeLink.className = 'remove-link';
            removeLink.href = '#';
            removeLink.textContent = '❌';
            removeLink.style.color = 'red'; // Optional: Make it visually distinct
            removeLink.style.marginLeft = '10px'; // Spacing between item name and remove link

            // Add event listener for remove link
            removeLink.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                removeItemFromSubCollection(doc.id, listItem); // Call the function to remove the item
            });

            // Append remove link to the list item
            listItem.appendChild(removeLink);

            // Add event listener for selecting item
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

// Function to remove item from the sub-collection
async function removeItemFromSubCollection(itemId, listItem) {
    try {
        // Reference to the specific document in the sub-collection
        const itemRef = doc(db, "department", departmentId, departmentName, itemId);

        // Delete the document
        await deleteDoc(itemRef);
        
        // Remove the list item from the UI
        listItem.remove();
        
        console.log("Item removed from sub-collection successfully!");
    } catch (error) {
        console.error("Error removing item from sub-collection:", error);
    }
}


// Event listener for adding an item
document.getElementById('addItemBtn').addEventListener('click', addItemToSubCollection);

// Load data from the department's sub-collection on page load
loadSubCollectionData();

// Event listener for "Next" button
document.getElementById('nextBtn').addEventListener('click', () => {
    if (departmentName && departmentId && selectedChoice) {
        // Remove the "❌" character from selectedChoice if it exists
        const cleanedChoice = selectedChoice.replace('❌', '').trim();

        // Encode the cleaned choice in the URL
        const encodedChoice = encodeURIComponent(cleanedChoice);
        const url = `sectioncontroll.html?departmentName=${departmentName}&departmentId=${departmentId}&selectedChoice=${encodedChoice}`;
        window.location.href = url;
    } else {
        alert('Please select an item before proceeding.');
    }
});
