// ===================================================
// 📌 تحميل قائمة المرضى من localStorage
// ===================================================
function loadPatients() {
    const patientSelect = document.getElementById("patientSelect");
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith("patient_")) {
            const username = key.replace("patient_", "").trim();
            if (username && username.length >= 3 && !username.includes("@") && username !== "username" && username !== "undefined") {
                const option = document.createElement("option");
                option.value = username;
                option.textContent = username;
                patientSelect.appendChild(option);
            }
        }
    }
}

// ===================================================
// 📌 تحميل قائمة الأدوية مع تعطيل الأدوية المتعارضة
// ===================================================
function loadMedicines(patient) {
    const medicineSelect = document.getElementById("medicineSelect");
    medicineSelect.innerHTML = '<option value="">اختر الدواء...</option>';

    const currentMeds = JSON.parse(localStorage.getItem("prescriptions_" + patient)) || [];

    Object.keys(medicines).forEach(med => {
        const option = document.createElement("option");
        option.value = med;
        option.textContent = med;

        // تحقق من التعارض مباشرة من medicines.js
        const isConflicting = currentMeds.some(p => medicines[p.medicine]?.conflicts?.[med] === 1);
        if (isConflicting) {
            option.disabled = true;
            option.textContent += " ⚠️ متعارض مع دواء موجود";
        }

        medicineSelect.appendChild(option);
    });
}

// ===== دالة لتصفير كل الحقول =====
function resetForm() {
    document.getElementById("patientSelect").value = "";
    document.getElementById("medicineSelect").innerHTML = '<option value="">اختر الدواء...</option>';
    document.getElementById("medicineSelect").disabled = true;
    document.getElementById("doseTimes").value = "";
    document.getElementById("durationSelect").value = "";
}

// ===== حفظ الوصفة مع التحقق من التعارض النهائي =====
function savePrescription() {
    const patient = document.getElementById("patientSelect").value;
    const med = document.getElementById("medicineSelect").value;
    const doseTimes = document.getElementById("doseTimes").value;
    const duration = document.getElementById("durationSelect").value;

    if(!patient || !med || !doseTimes || !duration){
        alert("الرجاء تعبئة جميع الحقول.");
        return;
    }

    let oldList = JSON.parse(localStorage.getItem("prescriptions_" + patient)) || [];

    // تحقق إذا سبق صرف الدواء
    if(oldList.some(p => p.medicine === med)){
        alert("تم صرف هذا الدواء لهذا المريض مسبقًا!");
        resetForm();  // ← هنا نضيف التصفير
        return;
    }

    // تحقق من التعارض النهائي قبل الحفظ
    const hasConflict = oldList.some(p => medicines[p.medicine]?.conflicts?.[med] === 1);
    if(hasConflict){
        alert("⚠️ لا يمكن صرف هذا الدواء لأنه يتعارض مع دواء آخر مصروف لهذا المريض!");
        resetForm();  // ← نفس الشيء هنا
        return;
    }

    // إضافة الوصفة
    const prescription = {
        medicine: med,
        dose: `${doseTimes} مرات كل يوم لمدة ${duration} يوم`,
        Vid: medicines[med].vid,
        desc: medicines[med].desc,
        usage: medicines[med].usage,
        questions: medicines[med].questions.map(q => ({ text: q.text, score: q.score })),
        contraindications: medicines[med].contraindications || [],
    };

    oldList.push(prescription);
    localStorage.setItem("prescriptions_" + patient, JSON.stringify(oldList));

    alert("تم صرف الدواء بنجاح!");
    resetForm();  // ← وبعد النجاح أيضا
}


// ===================================================
// 📌 تشغيل الدوال عند تحميل الصفحة
// ===================================================
window.onload = function() {
    loadPatients();

    const patientSelect = document.getElementById("patientSelect");
    const saveBtn = document.getElementById("savePrescriptionBtn");

    patientSelect.addEventListener("change", () => {
        const patient = patientSelect.value;
        if (patient) {
            loadMedicines(patient);
            document.getElementById("medicineSelect").disabled = false;
        } else {
            document.getElementById("medicineSelect").disabled = true;
        }
    });

    if(saveBtn) saveBtn.addEventListener("click", savePrescription);
};
