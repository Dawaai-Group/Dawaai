// ------------------------------
// UNIVERSAL CHAT POPUP (fixed)
// ------------------------------
const CHAT_KEY = "patientDoctorChat"; // storage key
let currentPatient = null; // for doctor view

// ------------------------------
// STORAGE FUNCTIONS
// ------------------------------
function loadChat() {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
}

function saveChat(data) {
    localStorage.setItem(CHAT_KEY, JSON.stringify(data));
}

// ------------------------------
// HELPERS
// ------------------------------
function getLoggedPatientUsername() {
    // returns logged-in patient username (or null)
    return localStorage.getItem("patient_username") || null;
}

function isDoctor() {
    // keep your existing heuristic (page path includes "doctor")
    return window.location.pathname.includes("doctor");
}

// convert File -> Base64 (returns Promise)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

// ------------------------------
// ADD TO CHAT
// ------------------------------
function addToChat(type, content, sender, patientId = null) {
    const chat = loadChat();
    chat.push({ type, content, sender, patientId, time: Date.now() });
    saveChat(chat);

    // Update UI
    renderChat();

    // If a patient sent a message, show notification to doctor
    if (sender === "patient") {
        notifyDoctorIfNeeded(sender, patientId);
    }
}

// ------------------------------
// SEND FUNCTIONS
// ------------------------------
async function sendChatMessage() {
    const input = document.getElementById("chatInput");
    if (!input || !input.value.trim()) return;

    const pid = getPatientIdForSend();
    if (!pid) {
        alert("Error: patient not identified. Make sure you are logged in (patient) or selected a patient (doctor).");
        return;
    }

    addToChat("text", input.value.trim(), isDoctor() ? "doctor" : "patient", pid);
    input.value = "";
}

async function sendImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const pid = getPatientIdForSend();
    if (!pid) {
        alert("Error: patient not identified. Make sure you are logged in (patient) or selected a patient (doctor).");
        return;
    }

    try {
        // convert image to base64 (persists across reloads)
        const base64 = await fileToBase64(file);
        addToChat("image", base64, isDoctor() ? "doctor" : "patient", pid);
    } catch (err) {
        console.error("Image read error:", err);
        alert("Failed to read image.");
    }
}

// decide which patientId must be used when sending
function getPatientIdForSend() {
    if (isDoctor()) {
        // doctor must have selected a patient from the list first
        return currentPatient;
    } else {
        // patient uses their logged-in username
        return getLoggedPatientUsername();
    }
}

// ------------------------------
// OPEN POPUP
// ------------------------------
function openDoctorChatPopup() {

    // Always recreate container if removed
    let container = document.getElementById("doctorChatContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "doctorChatContainer";
        document.body.appendChild(container);
    }

    if (isDoctor()) {
        container.innerHTML = `
            <div id="patientList" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 220px;
                max-height: 320px;
                overflow-y:auto;
                background:white;
                border-radius:14px;
                box-shadow:0 0 12px rgba(0,0,0,0.15);
                z-index:9999;
                padding:10px;">
                <strong>Patients</strong>
                <div id="patients" style="margin-top:8px;"></div>
            </div>
            <div id="chatPopupContainer"></div>
        `;
        renderPatientList();
    } else {
        currentPatient = getLoggedPatientUsername();
        renderPatientChat();
    }
}

// ------------------------------
// RENDER PATIENT CHAT (for doctor or patient)
// ------------------------------
function renderPatientChat() {
    const container = document.getElementById("chatPopupContainer") || document.getElementById("doctorChatContainer");
    if (!container) return;

    // If doctor opened without selecting patient, show placeholder
    const headerName = isDoctor() ? (currentPatient ? ("- " + currentPatient) : "- Select a patient") : ("- " + (getLoggedPatientUsername() || "Guest"));

    container.innerHTML = `
        <div id="chatPopup"
             style="
                 position: fixed;
                 bottom: 20px;
                 right: 240px;
                 width: 360px;
                 height: 460px;
                 background: white;
                 border-radius: 14px;
                 box-shadow: 0 0 12px rgba(0,0,0,0.15);
                 display: flex;
                 flex-direction: column;
                 overflow: hidden;
                 z-index: 9999;">
             
            <div style="
                background:#4f46e5;
                color:white;
                padding: 10px;
                font-weight:bold;
                display:flex;
                justify-content: space-between;
                align-items:center;">
                <span>Chat ${headerName}</span>
                <button onclick="closeChatPopup()" 
                        style="background:none;border:none;color:white;font-size:18px;cursor:pointer;">×</button>
            </div>

            <div id="chatMessages" style="
                flex:1;
                padding:12px;
                overflow-y:auto;
                background:#f8f8f8;">
            </div>

            <div style="padding:8px; border-top:1px solid #ddd;">
                <input type="file" id="chatImageInput" accept="image/*" style="display:none" onchange="sendImage(event)">
                <div style="display:flex; gap:6px;">
                    <textarea id="chatInput"
                        placeholder="Write a message..."
                        style="flex:1; resize:none; padding:8px; border-radius:6px; border:1px solid #ccc; height:48px;"></textarea>

                    <button onclick="document.getElementById('chatImageInput').click()"
                            style="background:#eee;border:none;padding:8px 10px;border-radius:6px;cursor:pointer;">
                        📷
                    </button>

                    <button onclick="sendChatMessage()"
                            style="background:#4f46e5;color:white;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    `;

    renderChat();
}

// ------------------------------
// RENDER CHAT MESSAGES
// ------------------------------
function renderChat() {
    const box = document.getElementById("chatMessages");
    if (!box) return;

    const all = loadChat();

    let filtered = [];
    if (isDoctor()) {
        // For doctor show messages for selected patient only
        if (!currentPatient) {
            box.innerHTML = `<p style="color:#666">Select a patient from the list to see their messages.</p>`;
            return;
        }
        filtered = all.filter(m => m.patientId === currentPatient);
    } else {
        // For patient show only messages that belong to them
        const me = getLoggedPatientUsername();
        if (!me) {
            box.innerHTML = `<p style="color:#666">You are not logged in. Please log in to chat.</p>`;
            return;
        }
        filtered = all.filter(m => m.patientId === me);
    }

    box.innerHTML = "";

    filtered.forEach(msg => {
        // Friendly sender text
        let senderLabel = msg.sender;
        if (msg.sender === "doctor") senderLabel = isDoctor() ? "Doctor" : "Doctor";
        if (msg.sender === "patient") senderLabel = isDoctor() ? (msg.patientId || "Patient") : "You";

        if (msg.type === "text") {
            const align = msg.sender === "doctor" ? "left" : "right";
            const bg = msg.sender === "doctor" ? "#e6e6e6" : "#4f46e5";
            const color = msg.sender === "doctor" ? "black" : "white";

            box.innerHTML += `
                <div style="margin-bottom:10px; text-align:${align};">
                    <div style="
                        display:inline-block;
                        background:${bg};
                        color:${color};
                        padding:8px 12px;
                        border-radius:12px;
                        max-width:78%;
                        line-height:1.3;">
                        <div style="font-size:12px; opacity:0.9; margin-bottom:4px;"><strong>${senderLabel}</strong></div>
                        <div>${escapeHtml(msg.content)}</div>
                    </div>
                </div>
            `;
        } else if (msg.type === "image") {
            const align = msg.sender === "doctor" ? "left" : "right";
            box.innerHTML += `
                <div style="margin-bottom:10px; text-align:${align};">
                    <div style="display:inline-block; max-width:78%;">
                        <div style="font-size:12px; opacity:0.9; margin-bottom:6px;"><strong>${senderLabel}</strong></div>
                        <img src="${msg.content}" style="max-width:100%; border-radius:10px; display:block;" />
                    </div>
                </div>
            `;
        }
    });

    box.scrollTop = box.scrollHeight;
}

// small helper to avoid raw HTML injection
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ------------------------------
// CLOSE POPUP
// ------------------------------
function closeChatPopup() {
    const confirmClose = confirm("Are you sure you want to close the chat?");
    if (!confirmClose) return;
    document.getElementById("chatPopupContainer")?.remove();
    document.getElementById("doctorChatContainer")?.remove();
}

// ------------------------------
// NOTIFICATIONS
// ------------------------------
function notifyDoctorIfNeeded(sender, patientId) {
    // only notify if a patient sent a message and doctor page is present
    if (sender !== "patient") return;
    if (!isDoctor()) return;

    const notif = document.getElementById("chatNotification");
    if (!notif) return;

    notif.style.display = "block";
    notif.textContent = "New message";
    notif.onclick = () => {
        currentPatient = patientId;
        renderPatientChat();
        notif.style.display = "none";
    };
}

// ------------------------------
// PATIENT LIST FOR DOCTOR
// ------------------------------
function renderPatientList() {
    const patientsDiv = document.getElementById("patients");
    if (!patientsDiv) return;

    // ===== جمع المرضى من localStorage =====
    const patientIdsFromStorage = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("patient_")) {
            const username = key.replace("patient_", "").trim();
            // استبعاد الأسماء الغير صحيحة
            if (username && username !== "username" && username !== "null" && username !== "undefined") {
                patientIdsFromStorage.push(username);
            }
        }
    }

    // ===== جمع المرضى من الدردشة (chat) =====
    const chat = loadChat(); // الدالة موجودة عندك
    const patientIdsFromChat = chat.map(m => m.patientId).filter(id => id);

    // ===== دمج القائمتين وإزالة التكرار =====
    const patientIds = Array.from(new Set([...patientIdsFromStorage, ...patientIdsFromChat]));

    // ===== عرض القائمة =====
    patientsDiv.innerHTML = "";
    if (patientIds.length === 0) {
        patientsDiv.innerHTML = `<div style="color:#666">No patients yet</div>`;
        return;
    }

    patientIds.forEach(id => {
        const div = document.createElement("div");
        div.textContent = id;
        div.style.cursor = "pointer";
        div.style.padding = "8px 6px";
        div.style.borderBottom = "1px solid #f0f0f0";
        div.onclick = () => {
            currentPatient = id; // patient المختار
            renderPatientChat();
        };
        patientsDiv.appendChild(div);
    });
}


// ------------------------------
// INIT
// ------------------------------
// افتح الشات تلقائي للدكتور فقط
if (isDoctor()) {
    openDoctorChatPopup();
}

