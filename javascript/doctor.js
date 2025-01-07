import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAA1NB3xLMUvAGg1ni4m1JK_qrI96CSnGI",
    authDomain: "filmy-6bd1a.firebaseapp.com",
    projectId: "filmy-6bd1a",
    storageBucket: "filmy-6bd1a.appspot.com",
    messagingSenderId: "409354230199",
    appId: "1:409354230199:web:978e2be5c80f52a197b032",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Cloud Storage


document.getElementById('imageInput').addEventListener('change', function () {
    const fileNameSpan = document.getElementById('fileName');
    const fileName = this.files[0] ? this.files[0].name : 'لم يتم اختيار أي ملف';
    fileNameSpan.textContent = fileName;
});


// Function to populate the department select dropdown
async function populateDepartmentSelect() {
    const departmentSelect = document.getElementById('departmentSelect');
    const departmentsRef = collection(db, "department");

    try {
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
            option.text = department.name;
            departmentSelect.appendChild(option);
        });

        // Trigger change event to populate choice select initially
        departmentSelect.dispatchEvent(new Event('change'));
    } catch (error) {
        console.error("Error loading departments:", error);
    }
}

// Function to populate the choice select dropdown based on selected department
async function populateChoiceSelect() {
    const departmentSelect = document.getElementById('departmentSelect');
    const choiceSelect = document.getElementById('choiceSelect');
    const selectedDepartmentId = departmentSelect.value;
    const selectedDepartmentName = departmentSelect.options[departmentSelect.selectedIndex].text;
    choiceSelect.innerHTML = ''; // Clear existing options

    if (selectedDepartmentId) {
        // Fetch choices from the selected department's sub-collection
        const choicesRef = collection(db, "department", selectedDepartmentId, selectedDepartmentName);

        try {
            const querySnapshot = await getDocs(choicesRef);
            querySnapshot.forEach((doc) => {
                const choice = doc.data();
                const option = document.createElement('option');
                option.value = doc.id; // Use document ID as value (you can also use a name field if you have one)
                option.text = choice.itemName; // Display the itemName as the choice text
                choiceSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading choices:", error);
        }
    }
}



// Function to handle image upload and get URL
async function uploadImage(file) {
    const storageRef = ref(storage, `images/${file.name}`); // Create a reference in Cloud Storage
    const uploadTask = uploadBytes(storageRef, file);

    try {
        const snapshot = await uploadTask;
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        return null;
    }
}

// Function to handle form submission
async function submitRequest() {
    const departmentSelect = document.getElementById('departmentSelect');
    const choiceSelect = document.getElementById('choiceSelect');
    const doctorName = document.getElementById('doctorName').value;
    const imageInput = document.getElementById('imageInput');
    const itemName = document.getElementById('itemName').value;

    const selectedDepartmentId = departmentSelect.value;
    const selectedDepartmentName = departmentSelect.options[departmentSelect.selectedIndex].text;
    const selectedChoiceId = choiceSelect.value;
    const selectedChoiceName = choiceSelect.options[choiceSelect.selectedIndex].text;

    // Handle image upload
    let imageUrl = null;
    if (imageInput.files.length > 0) {
        imageUrl = await uploadImage(imageInput.files[0]);
        if (!imageUrl) {
            alert("Error uploading image. Please try again.");
            return;
        }
    }

    const requestData = {
        departmentId: selectedDepartmentId,
        departmentName: selectedDepartmentName,
        choiceId: selectedChoiceId,
        choiceName: selectedChoiceName,
        doctorName: doctorName,
        imageUrl: imageUrl,
        itemName: itemName,
        status: "pending" // Initial status of the request
    };

    try {
        // Add request to a "requests" collection
        const requestsRef = collection(db, "requests");
        await addDoc(requestsRef, requestData);

        console.log("Request submitted successfully!");
        alert("Your request has been submitted for review.");

        // Clear the form
        document.getElementById('doctorName').value = '';
        document.getElementById('imageInput').value = ''; // Clear file input
        document.getElementById('itemName').value = '';
    } catch (error) {
        console.error("Error submitting request:", error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', populateDepartmentSelect);
document.getElementById('departmentSelect').addEventListener('change', populateChoiceSelect);
document.getElementById('submitRequestBtn').addEventListener('click', submitRequest);