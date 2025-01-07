import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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

async function loadPendingRequests() {
    const requestList = document.getElementById('requestList');
    const requestsRef = collection(db, "requests");

    try {
        const querySnapshot = await getDocs(requestsRef);
        querySnapshot.forEach((doc) => {
            const request = doc.data();
            if (request.status === "pending") {
                const li = document.createElement('li');
                li.innerHTML = `
                    <p>Department: ${request.departmentName}</p>
                    <p>Choice: ${request.choiceName}</p>
                    <p>Doctor Name: ${request.doctorName}</p>
                    <p>Image URL: ${request.imageUrl}</p>
                    <p>Item Name: ${request.itemName}</p>
                    <button data-request-id="${doc.id}" class="approveBtn">Approve</button>
                    <button data-request-id="${doc.id}" class="rejectBtn">Reject</button>
                `;
                requestList.appendChild(li);
            }
        });

        // Event listeners for approve/reject buttons
        requestList.addEventListener('click', handleRequestAction);
    } catch (error) {
        console.error("Error loading pending requests:", error);
    }
}

// Function to handle approve/reject actions
async function handleRequestAction(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON') {
        const requestId = target.dataset.requestId;
        const isApproved = target.classList.contains('approveBtn');

        try {
            if (isApproved) {
                // Get the request data
                const requestRef = doc(db, "requests", requestId);
                const requestSnapshot = await getDoc(requestRef);
                const request = requestSnapshot.data();

                // Add data to the "items" sub-collection under the selected choice
                const itemsRef = collection(db, "department", request.departmentId, request.departmentName, request.choiceName, "items");
                await addDoc(itemsRef, {
                    doctorName: request.doctorName,
                    imageUrl: request.imageUrl,
                    itemName: request.itemName,
                });

                console.log("Request approved and data added to items collection!");
            }

            // Update request status (approved or rejected)
            const requestRef = doc(db, "requests", requestId);
            await updateDoc(requestRef, {
                status: isApproved ? "approved" : "rejected"
            });

            console.log(`Request ${isApproved ? 'approved' : 'rejected'} successfully!`);

            // Reload the requests list
            document.getElementById('requestList').innerHTML = ''; // Clear existing list
            loadPendingRequests();
        } catch (error) {
            console.error("Error handling request action:", error);
        }
    }
}


// Load pending requests on page load
document.addEventListener('DOMContentLoaded', loadPendingRequests);