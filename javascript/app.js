import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
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

let selectedChoice = null; // Variable to store the currently selected choice

// Function to load data from Firestore
async function loadData() {
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
        // Fetch choices (departments)
        const choicesSnapshot = await getDocs(collection(db, "department"));
        const choisesContainer = document.getElementById('choises');
        choisesContainer.innerHTML = '';
        choicesSnapshot.forEach(doc => {
            const choiceData = doc.data();

            // Create the main div for the choice
            const div = document.createElement('div');
            div.className = 'one';
            div.setAttribute('data-department-id', doc.id); // Store department ID

            // Create a span to hold the department name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = choiceData.name; // Only the name of the department
            nameSpan.className = 'department-name';

            // Create a remove link
            const removeLink = document.createElement('a');
            removeLink.className = 'remove-link';
            removeLink.href = '#'; // Placeholder link
            removeLink.textContent = '❌'; // Text for the link
            removeLink.style.color = 'red'; // Optional: Make it visually distinct
            removeLink.style.marginLeft = '10px'; // Spacing from choice text
            removeLink.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent page reload
                event.stopPropagation(); // Prevent triggering the click on the div
                removeChoice(doc.id, div); // Call function to remove the choice
            });

            // Append the name and remove link to the div
            div.appendChild(nameSpan);
            div.appendChild(removeLink);

            // Append the div to the container
            choisesContainer.appendChild(div);
        });

        enableChoiceSelection(); // Enable selection behavior for choices
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function removeChoice(departmentId, divElement) {
    try {
        // Delete department from Firestore
        const departmentRef = doc(db, "department", departmentId);
        await deleteDoc(departmentRef);

        // Remove the department div from the UI
        divElement.remove();

        alert('Department removed successfully!');
    } catch (error) {
        console.error('Error removing department:', error);
        alert('Error removing department');
    }
}


// Upload new logo to Firebase Storage and Firestore
async function uploadLogo(inputId, logoName) {
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];

    if (file) {
        const storageRef = ref(storage, `logos/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const logosCollection = collection(db, "logos");
        const logoDocs = await getDocs(logosCollection);

        let found = false;
        logoDocs.forEach(doc => {
            if (doc.data().name === logoName) {
                updateDoc(doc.ref, { url: downloadURL });
                found = true;
            }
        });

        if (!found) {
            await addDoc(logosCollection, { name: logoName, url: downloadURL });
        }

        document.getElementById(logoName).src = downloadURL; // Update the displayed logo
    }
}

// Add new choice (department) to Firestore
async function addChoice() {
    const newChoice = document.getElementById('newChoice').value.trim();
    if (newChoice) {
        const departmentCollection = collection(db, "department");
        const departmentDocRef = await addDoc(departmentCollection, { name: newChoice }); // Add the department and get its ID

        const choisesContainer = document.getElementById('choises');
        const div = document.createElement('div');
        div.className = 'one';
        div.textContent = newChoice;
        div.setAttribute('data-department-id', departmentDocRef.id); // Store the department ID
        choisesContainer.appendChild(div);

        enableChoiceSelection(); // Re-enable selection behavior for new choice
        document.getElementById('newChoice').value = '';
    }
}

const addnewchoise = document.getElementById('addChoiceBtn');

addnewchoise.addEventListener("click", () => {
    addChoice();
})

// Enable selection of choices
function enableChoiceSelection() {
    const choices = document.querySelectorAll('.choise .one');
    choices.forEach(choice => {
        choice.addEventListener('click', () => {
            // Reset background color for all choices
            choices.forEach(c => c.style.backgroundColor = '');

            // Highlight selected choice
            choice.style.backgroundColor = '#D3D3D3';

            // Get the department name from the span element
            const nameSpan = choice.querySelector('.department-name');
            selectedChoice = nameSpan.textContent.trim(); // Store selected choice (name)

            // Store selected department ID as well:
            selectedChoiceId = choice.getAttribute('data-department-id');
        });
    });
}

// Global variable to store the selected department's ID:
let selectedChoiceId = null;

// Navigate to upload page with selected choice and department ID
document.getElementById('nextBtn').addEventListener('click', () => {
    if (selectedChoice && selectedChoiceId) {
        const url = `choisecontroll.html?choice=${encodeURIComponent(selectedChoice)}&departmentId=${selectedChoiceId}`;
        window.location.href = url;
    } else {
        alert('Please select a choice before proceeding.');
    }
});

// Event listeners for logo editing
document.getElementById('editLogo1').addEventListener('click', () => document.getElementById('logo1Input').click());
document.getElementById('logo1Input').addEventListener('change', () => uploadLogo('logo1Input', 'logo1'));

document.getElementById('editLogo2').addEventListener('click', () => document.getElementById('logo2Input').click());
document.getElementById('logo2Input').addEventListener('change', () => uploadLogo('logo2Input', 'logo2'));

// Initial load of data
loadData();