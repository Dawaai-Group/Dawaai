
(function () {
    const publicPages = [
        "/index.html",
        "/doctor-login.html",
        "/patient-login.html",
        "/patient-register.html"
    ];

    const current = window.location.pathname.toLowerCase();

    // Allow public pages
    if (publicPages.some(p => current.endsWith(p))) return;

    // Check stored login
    const doctor = localStorage.getItem("doctor_logged_in") === "true";
    const patient = localStorage.getItem("patient_logged_in") === "true";

    if (!doctor && !patient) {
        // Not logged in → send to homepage/login
        window.location.href = "index.html";
    }
})();
