/*=====================================================
 🟣 1) التحقق من قوة كلمة المرور
=====================================================*/
function isStrongPassword(pass){
    const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
}

/*=====================================================
 🟢 2) Hash بسيط (للتجربة)
=====================================================*/
function simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}

/*=====================================================
 🔵 3) تسجيل دخول الطبيب
=====================================================*/
document.getElementById("doctorLoginForm")?.addEventListener("submit", function(e){
    e.preventDefault();

    let user = doctorUsername.value;
    let pass = doctorPassword.value;

    const defaultPassword = "Dr@2025!Health";
    let savedHash = localStorage.getItem("doctor_" + user);

    if(savedHash === null){
        // أول مرة — يجب استخدام كلمة المرور الافتراضية
        if(pass === defaultPassword){
            // تسجيل الدخول + إجبار على تغيير كلمة المرور
            localStorage.setItem("doctor_logged_in", "true"); // ✅ set logged-in
            localStorage.setItem("pending_doctor", user); 
            window.location.href = "doctor-change-password.html";
        } else {
            alert("كلمة المرور غير صحيحة.");
        }
    } else {
        if(simpleHash(pass) === savedHash){
            localStorage.setItem("doctor_logged_in", "true"); // ✅ set logged-in
            window.location.href = "doctor-dashboard.html";
        } else {
            alert("كلمة المرور غير صحيحة.");
        }
    }
});

/*=====================================================
 🟠 4) صفحة تغيير كلمة مرور الطبيب
=====================================================*/
document.getElementById("changeDoctorPassForm")?.addEventListener("submit", function(e){
    e.preventDefault();

    let newPass = newDoctorPassword.value;
    let confirmPass = confirmDoctorPassword.value;
    let user = localStorage.getItem("pending_doctor");

    if(!user){
        alert("خطأ! لا يوجد طبيب مسجل لتغيير كلمة المرور.");
        return;
    }

    if(newPass !== confirmPass){
        alert("كلمتا المرور غير متطابقتين!");
        return;
    }

    if(!isStrongPassword(newPass)){
        alert("❗ كلمة المرور ضعيفة! يجب أن تحتوي على:\n- حرف كبير\n- حرف صغير\n- رقم\n- رمز\n- 8 أحرف على الأقل");
        return;
    }

    localStorage.setItem("doctor_" + user, simpleHash(newPass));
    localStorage.removeItem("pending_doctor");

    alert("تم تحديث كلمة المرور بنجاح!");
    window.location.href = "doctor-login.html";
});

/*=====================================================
 🟣 5) تسجيل حساب مريض جديد
=====================================================*/
document.getElementById("registerForm")?.addEventListener("submit", function(e){
    e.preventDefault();

    let user = registerUsername.value.trim();
    let pass = registerPassword.value;

    if(localStorage.getItem("patient_" + user)){
        alert("❗ هذا اسم المستخدم موجود مسبقاً. اختر اسماً آخر.");
        return;
    }

    if(!isStrongPassword(pass)){
        alert("❗ كلمة المرور ضعيفة!");
        return;
    }

    localStorage.setItem("patient_" + user, simpleHash(pass));

    alert("تم إنشاء الحساب بنجاح!");
    window.location.href = "patient-login.html";
});

/*=====================================================
 🟢 6) تسجيل دخول المريض 
=====================================================*/
document.getElementById("patientLoginForm")?.addEventListener("submit", function(e){
    e.preventDefault();

    let user = patientUsername.value.trim();
    let pass = patientPassword.value;

    let savedHash = localStorage.getItem("patient_" + user);

    if (!savedHash) {
        alert("❗ لا يوجد حساب بهذا الاسم.");
        return;
    }

    if (simpleHash(pass) === savedHash) {
        // ✅ Save logged-in flag
        localStorage.setItem("patient_logged_in", "true");
        localStorage.setItem("patient_username", user);

        // Redirect
        window.location.href = "patient-dashboard.html";
    } else {
        alert("كلمة المرور غير صحيحة.");
    }
});

/*=====================================================
 🔴 7) تسجيل خروج (يمكن وضعه في أي صفحة محمية)
=====================================================*/
function logout() {
    localStorage.removeItem("doctor_logged_in");
    localStorage.removeItem("patient_logged_in");
    window.location.href = "index.html";
}
