(function () {

    // تحميل اسم المستخدم من التخزين
    const patientUsername = localStorage.getItem("patient_username");
    const listContainer = document.getElementById("medicines-list");

    if (!patientUsername) {
        listContainer.innerHTML = "<p>خطأ: المريض غير معرف. الرجاء تسجيل الدخول.</p>";
        return;
    }

    // تحميل قائمة الوصفات الخاصة بالمريض
    const prescriptions = JSON.parse(localStorage.getItem("prescriptions_" + patientUsername)) || [];

    listContainer.innerHTML = "";

    if (prescriptions.length === 0) {
        listContainer.innerHTML = "<a>💊 لا توجد أدوية بعد</a>";
        return;
    }

    // عرض كل دواء في القائمة
    prescriptions.forEach((prescription, index) => {
        const a = document.createElement("a");
        a.href = "patient-prescription.html?index=" + index;
        a.textContent = "💊 " + prescription.medicine;
        listContainer.appendChild(a);
    });

})();
