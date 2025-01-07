import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore, collection, getDocs,getDoc ,where , doc, updateDoc, runTransaction, addDoc, query, orderBy, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";

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


// Status Order Mapping
const statusOrder = {
    "تم البدأ": 1,
    "الاستقبال للتسجيل": 2,
    "فحص مبدئي": 3,
    "العيادة": 4,
    "انتهاء الخدمة": 5
};



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

            const departmentDiv = document.createElement('div');
            departmentDiv.innerHTML = `
                <h2>Department: ${departmentName}</h2>
                <ul id="queue-${departmentId}"></ul>
            `;
            queueList.appendChild(departmentDiv);

            const queueEntriesList = document.getElementById(`queue-${departmentId}`);

            // Real-time listener for queue updates
            const queueRef = doc(db, "queue", departmentId);
            onSnapshot(queueRef, (queueSnap) => {
                queueEntriesList.innerHTML = ""; // Clear existing entries
                if (queueSnap.exists()) {
                    const queueData = queueSnap.data().queue;

                    // Sort queue by waiting number
                    queueData.sort((a, b) => a.waitingNumber - b.waitingNumber);

                    queueData.forEach((entry) => {
                        const entryItem = document.createElement('div');
                        entryItem.className = 'item';
                        entryItem.innerHTML = `
                            <div class='itemone'>
                                <div>رقم الإنتظار: ${entry.waitingNumber}</div>
                                <div>الإسم: ${entry.userId}</div>
                                <div>القسم: ${entry.selectedChoice}</div>
                                <div>الموعد: ${entry.selectedItem.data.serviceName}</div>
                            </div>
                            <div>
                                حالة الطلب : 
                                <span id="status-${departmentId}-${entry.waitingNumber}">${entry.status || 'تم البدأ'}</span>
                            </div>
                            <div class='statusbtns'>
                                <button class="startage" data-status="تم البدأ" data-department-id="${departmentId}" data-waiting-number="${entry.waitingNumber}">تم البدأ</button>
                                <button class="welcomee" data-status="الاستقبال للتسجيل" data-department-id="${departmentId}" data-waiting-number="${entry.waitingNumber}">الاستقبال للتسجيل</button>
                                <button class="check" data-status="فحص مبدئي" data-department-id="${departmentId}" data-waiting-number="${entry.waitingNumber}">فحص مبدئي</button>
                                <button class="clinic" data-status="العيادة" data-department-id="${departmentId}" data-waiting-number="${entry.waitingNumber}">العيادة</button>
                                <button class="finised" data-status="انتهاء الخدمة" data-department-id="${departmentId}" data-waiting-number="${entry.waitingNumber}">انتهاء الخدمة</button>
                            </div>
                        `;
                        queueEntriesList.appendChild(entryItem);

                        // Add event listeners to status buttons
                        const statusBtns = entryItem.querySelectorAll('.statusbtns button');
                        statusBtns.forEach((btn) => {
                            btn.addEventListener('click', async () => {
                                const departmentId = btn.getAttribute('data-department-id');
                                const waitingNumber = btn.getAttribute('data-waiting-number');
                                const newStatus = btn.getAttribute('data-status');
                                await updateOrderStatus(departmentId, waitingNumber, newStatus);
                            });
                        });

                        // Set initial button states and background color
                        statusBtns.forEach(button => {
                            const buttonStatus = button.getAttribute('data-status');
                            button.disabled = statusOrder[buttonStatus] <= statusOrder[entry.status];
                        });
                        entryItem.style.backgroundColor = getStatusColor(entry.status || 'تم البدأ');
                    });
                } else {
                    const noEntryItem = document.createElement('div');
                    noEntryItem.textContent = "No entries in the queue.";
                    queueEntriesList.appendChild(noEntryItem);
                }
            });
        });
    } catch (error) {
        console.error("Error loading queues:", error);
    }
}

// Helper function to get the previous status
function getPreviousStatus(currentStatus) {
    const order = Object.keys(statusOrder);
    const currentIndex = order.indexOf(currentStatus);
    if (currentIndex > 0) {
        return order[currentIndex - 1];
    }
    return null; // No previous status
}

async function updateOrderStatus(departmentId, waitingNumber, newStatus) {
    try {
        const queueRef = doc(db, "queue", departmentId);
        const queueSnap = await getDoc(queueRef);

        if (queueSnap.exists()) {
            let queueData = queueSnap.data().queue;
            let userIndex = queueData.findIndex(
                (item) => item.waitingNumber === parseInt(waitingNumber)
            );

            if (userIndex !== -1) {
                // Update user's status in the queue
                queueData[userIndex].status = newStatus;

                // Prepare order data for 'orders' collection (we won't use userId)
                const orderData = {
                    departmentId: departmentId,
                    departmentName: queueData[userIndex].departmentName || "Unknown",
                    selectedChoice: queueData[userIndex].selectedChoice,
                    selectedService: queueData[userIndex].selectedItem?.data?.serviceName || "Unknown",
                    waitingNumber: parseInt(waitingNumber),
                    status: newStatus,
                    createdAt: new Date().toISOString(),
                };

                // Add or update order in 'orders' collection
                const ordersRef = collection(db, "orders");
                const orderQuery = query(
                    ordersRef,
                    where("waitingNumber", "==", orderData.waitingNumber),
                    where("departmentId", "==", departmentId)
                );
                const orderQuerySnapshot = await getDocs(orderQuery);

                if (!orderQuerySnapshot.empty) {
                    const orderDocRef = orderQuerySnapshot.docs[0].ref;
                    await updateDoc(orderDocRef, orderData);
                    console.log(`Order status updated for waiting number: ${waitingNumber}`);
                } else {
                    await addDoc(ordersRef, orderData);
                    console.log(`New order created for waiting number: ${waitingNumber}`);
                }

                // If the new status is 'انتهاء الخدمة', remove the item from all collections
                if (newStatus === 'انتهاء الخدمة') {
                    // Remove from 'queue'
                    queueData.splice(userIndex, 1); // Remove from local queue array
                    await updateDoc(queueRef, { queue: queueData });

                    // Remove from 'orders'
                    if (!orderQuerySnapshot.empty) {
                        const orderDocRef = orderQuerySnapshot.docs[0].ref;
                        await deleteDoc(orderDocRef);
                        console.log(`Order deleted for waiting number: ${waitingNumber}`);
                    }

                    // Remove the item from the UI
                    const entryItem = document.getElementById(`status-${departmentId}-${waitingNumber}`).closest('.item');
                    entryItem.remove();
                } else {
                    // Update the status display in real-time
                    const statusSpan = document.getElementById(`status-${departmentId}-${waitingNumber}`);
                    statusSpan.textContent = newStatus;

                    // Update the background color of the item
                    const itemElement = statusSpan.closest('.item');
                    itemElement.style.backgroundColor = getStatusColor(newStatus);

                    // Update button states
                    const buttons = itemElement.querySelectorAll('.statusbtns button');
                    buttons.forEach((btn) => {
                        const btnStatus = btn.getAttribute('data-status');
                        btn.disabled = statusOrder[btnStatus] <= statusOrder[newStatus];
                    });
                }
            } else {
                console.error("User not found in the queue.");
            }
        } else {
            console.error("Queue document not found.");
        }
    } catch (error) {
        console.error("Error updating order status:", error);
    }
}



// Helper function to get background color based on status
function getStatusColor(status) {
    switch (status) {
        case "تم البدأ":
            return "#d1f7c4"; // Light green
        case "الاستقبال للتسجيل":
            return "#f7e9c4"; // Light yellow
        case "فحص مبدئي":
            return "#c4d7f7"; // Light blue
        case "العيادة":
            return "#f7c4c4"; // Light red
        case "انتهاء الخدمة":
            return "#c4c4c4"; // Gray
        default:
            return "#ffffff"; // Default white
    }
}

// Load queues on page load
document.addEventListener('DOMContentLoaded', loadQueues);