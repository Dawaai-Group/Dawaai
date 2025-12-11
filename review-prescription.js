// ===================================================
// 📌 تحميل قائمة المرضى
// ===================================================
function loadPatients() {
    const patientSelect = document.getElementById("patientSelect");
    patientSelect.innerHTML = '<option value="">اختر المريض...</option>';

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("patient_")) {
            const username = key.replace("patient_", "").trim();
            if (username && username !== "username" && username !== "undefined" && !username.includes("@") && username.length >= 3) {
                const option = document.createElement("option");
                option.value = username;
                option.textContent = username;
                patientSelect.appendChild(option);
            }
        }
    }
}

// ===================================================
// 📌 تحميل أدوية المريض
// ===================================================
function loadPatientMedicines() {
    const patient = document.getElementById("patientSelect").value;
    const medicineSelect = document.getElementById("medicineSelect");
    medicineSelect.innerHTML = '<option value="">اختر الدواء...</option>';

    if (!patient) {
        medicineSelect.disabled = true;
        document.getElementById("showPrescriptionBtn").disabled = true;
        return;
    }

    const prescriptions = JSON.parse(localStorage.getItem("prescriptions_" + patient)) || [];
    prescriptions.forEach(p => {
        const option = document.createElement("option");
        option.value = p.medicine;
        option.textContent = p.medicine;
        medicineSelect.appendChild(option);
    });

    medicineSelect.disabled = prescriptions.length === 0;
    document.getElementById("showPrescriptionBtn").disabled = prescriptions.length === 0;
}

// ===================================================
// 📌 مساعدة لجلب المفتاح لكل جرعة
// ===================================================
function getDoseKey(patient, med, dateStr, timeStr) {
    return `dose_${patient}_${med}_${dateStr}_${timeStr}`;
}

// ===================================================
// 📌 عرض جدول الجرعات
// ===================================================
function showPrescription() {
    const patient = document.getElementById("patientSelect").value;
    const med = document.getElementById("medicineSelect").value;
    const container = document.getElementById("medSchedule");
    container.innerHTML = "";

    if (!patient || !med) return;

    const prescriptions = JSON.parse(localStorage.getItem("prescriptions_" + patient)) || [];
    const p = prescriptions.find(p => p.medicine === med);
    if (!p) return;

    // عرض اسم الدواء والجرعة
    const title = document.createElement("h3");
    title.textContent = `${p.medicine} - ${p.dose}`;
    container.appendChild(title);

    // التحقق إذا المريض قام بتعيين أول جرعة
    const firstDoseSaved = localStorage.getItem(`firstDose_${patient}_${med}`);
    if (!firstDoseSaved) {
        const noSchedule = document.createElement("p");
        noSchedule.textContent = "لم يقم المريض بتحديد وقت الجرعات بعد، لا يوجد جدول.";
        container.appendChild(noSchedule);
        return;
    }

    const { hour, minute, period } = JSON.parse(firstDoseSaved);

    // استخراج عدد مرات الدواء يوميًا من نص الجرعة
    const dosesMatch = p.dose.match(/(\d+)\s*مرات/);
    const dosesPerDay = dosesMatch ? parseInt(dosesMatch[1]) : 1;

    // تحديد عدد الأيام: دائمًا أسبوع كامل
    const durationDays = 7;

    // توليد جدول الأيام
    const schedule = [];
    const startDate = new Date();
    for (let i = 0; i < durationDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        schedule.push(date);
    }

    // إنشاء الجدول
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "10px";

    // رأس الجدول: الأيام
    const trHead = document.createElement("tr");
    schedule.forEach(date => {
        const th = document.createElement("th");
        th.textContent = date.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'short' });
        th.style.border = "1px solid #ccc";
        th.style.padding = "5px";
        trHead.appendChild(th);
    });
    table.appendChild(trHead);

    // صف الجرعات لكل يوم
    for (let doseIndex = 0; doseIndex < dosesPerDay; doseIndex++) {
        const trDose = document.createElement("tr");
        schedule.forEach(date => {
            const td = document.createElement("td");
            td.style.border = "1px solid #ccc";
            td.style.padding = "5px";
            td.style.textAlign = "center";

            // حساب وقت الجرعة
            let h = parseInt(hour);
            if (period === "PM" && h !== 12) h += 12;
            if (period === "AM" && h === 12) h = 0;

            // توزيع الجرعات على اليوم
            h = (h + doseIndex * Math.floor(24 / dosesPerDay)) % 24;
            const displayHour = h % 12 === 0 ? 12 : h % 12;
            const displayPeriod = h >= 12 ? "PM" : "AM";
            const minStr = minute.toString().padStart(2, "0");
            const timeStr = `${displayHour}:${minStr} ${displayPeriod}`;

            // التحقق من حالة الجرعة
            const key = getDoseKey(patient, med, date.toISOString().split('T')[0], timeStr);
            const taken = localStorage.getItem(key) === "true";

            td.textContent = timeStr + (taken ? " ✅" : " ❌");
            trDose.appendChild(td);
        });
        table.appendChild(trDose);
    }

    container.appendChild(table);
    document.getElementById("prescriptionTableContainer").style.display = "block";
}

// ===================================================
// 📌 تشغيل الدوال عند تحميل الصفحة
// ===================================================
window.onload = function() {
    loadPatients();
    document.getElementById("patientSelect").addEventListener("change", loadPatientMedicines);
    document.getElementById("showPrescriptionBtn").addEventListener("click", showPrescription);
};
