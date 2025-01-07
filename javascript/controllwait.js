import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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

// Function to load and display queues for each department
async function loadQueues() {
  const queueList = document.getElementById('queueList');
  queueList.innerHTML = ''; // Clear existing list

  const departmentsRef = collection(db, "department");

  try {
    // Get all departments
    const departmentsSnapshot = await getDocs(departmentsRef);
    departmentsSnapshot.forEach(async (departmentDoc) => {
      const departmentId = departmentDoc.id;
      const departmentName = departmentDoc.data().name;

      // Get the queue for each department
      const queueRef = doc(db, "queue", departmentId);
      const queueSnap = await getDoc(queueRef);

      if (queueSnap.exists()) {
        const queueData = queueSnap.data().queue;

        // Display the queue information for the department
        const departmentDiv = document.createElement('div');
        departmentDiv.innerHTML = `
          <h2>Department: ${departmentName}</h2>
          <ul id="queue-${departmentId}"></ul>
          <button data-department-id="${departmentId}" class="endQueueBtn">End Queue</button>
        `;
        queueList.appendChild(departmentDiv);

        // Display the queue entries for the department
        const queueEntriesList = document.getElementById(`queue-${departmentId}`);
        if (queueData && queueData.length > 0) {
          queueData.forEach((entry) => {
            const entryItem = document.createElement('li');
            entryItem.textContent = `Waiting Number: ${entry.waitingNumber}, User: ${entry.userId}`; // Customize as needed
            queueEntriesList.appendChild(entryItem);
          });
        } else {
          const noEntryItem = document.createElement('li');
          noEntryItem.textContent = "No entries in the queue.";
          queueEntriesList.appendChild(noEntryItem);
        }

        // Add event listener to "End Queue" button
        const endQueueBtn = departmentDiv.querySelector('.endQueueBtn');
        endQueueBtn.addEventListener('click', () => {
          endQueue(departmentId);
        });
      } else {
        const noQueueDiv = document.createElement('div');
        noQueueDiv.innerHTML = `
          <h2>Department: ${departmentName}</h2>
          <p>No queue found for this department.</p>
        `;
        queueList.appendChild(noQueueDiv);
      }
    });
  } catch (error) {
    console.error("Error loading queues:", error);
  }
}

// Function to end a queue
async function endQueue(departmentId) {
  try {
    await runTransaction(db, async (transaction) => {
      const queueRef = doc(db, "queue", departmentId);
      transaction.update(queueRef, { queue: [] }); // Clear the queue
    });

    console.log("Queue ended successfully for department:", departmentId);
    loadQueues(); // Reload the queues
  } catch (error) {
    console.error("Error ending queue:", error);
  }
}

// Load queues on page load
document.addEventListener('DOMContentLoaded', loadQueues);