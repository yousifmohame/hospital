import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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

let selectedChoice = null; // Variable to track the selected choice name
let selectedChoiceId = null; // Variable to track the selected choice ID

async function loadData() {
  try {
    // Load logos
    const logosSnapshot = await getDocs(collection(db, "logos"));
    logosSnapshot.forEach(doc => {
      const logoData = doc.data();
      if (logoData.name === "logo1") {
        document.getElementById("logo1").src = logoData.url;
      } else if (logoData.name === "logo2") {
        document.getElementById("logo2").src = logoData.url;
      }
    });

    // Load choices
    const choicesSnapshot = await getDocs(collection(db, "department"));
    const choisesContainer = document.getElementById("choises");
    choisesContainer.innerHTML = ""; // Clear existing choices
    choicesSnapshot.forEach(doc => {
      const choiceData = doc.data();
      const div = document.createElement("div");
      div.className = "one";
      div.textContent = choiceData.name;
      div.setAttribute('data-department-id', doc.id); // Set the department ID
      div.addEventListener('click', () => {
        // Highlight the selected choice
        const choices = document.querySelectorAll('.choise .one');
        choices.forEach(c => c.style.backgroundColor = ''); // Reset background color
        div.style.backgroundColor = '#D3D3D3'; // Highlight selected choice

        // Update selected choice name and ID
        selectedChoice = choiceData.name;
        selectedChoiceId = doc.id;
      });
      choisesContainer.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Error loading data. See console for details.");
  }
}

document.getElementById('nextBtn').addEventListener('click', () => {
  if (selectedChoice && selectedChoiceId) {
    const url = `choise.html?choice=${encodeURIComponent(selectedChoice)}&departmentId=${selectedChoiceId}`;
    window.location.href = url;
  } else {
    alert('Please select a choice before proceeding.');
  }
});

// Load data on page load
document.addEventListener("DOMContentLoaded", loadData);