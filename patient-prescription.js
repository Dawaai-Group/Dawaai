// ===== تحميل بيانات المستخدم والوصفة =====
const patient = localStorage.getItem("patient_username");
if (!patient) {
    alert("خطأ: المريض غير معرف. الرجاء تسجيل الدخول.");
    window.location.href = "login.html";
}

const params = new URLSearchParams(window.location.search);
const index = params.get("index");
const list = JSON.parse(localStorage.getItem("prescriptions_" + patient)) || [];
const p = list[index];

if (!p) {
    alert("خطأ: لم يتم العثور على الوصفة.");
}

// ===== تجهيز الأسئلة والدواء =====
if (p) {
    p.questions = (p.questions || []).map(q => {
        if (typeof q === "string") return { text: q, score: 1 };
        const scoreNum = Number(q.score);
        return { text: q.text || "", score: Number.isFinite(scoreNum) ? scoreNum : 0 };
    });

    document.getElementById("medName").textContent = p.medicine;
    document.getElementById("medVid").textContent = p.Vid;
    document.getElementById("medDesc").textContent = p.desc;
    document.getElementById("medUsage").textContent = p.usage;
    document.getElementById("medDose").textContent = p.dose;
    // ===== عرض الموانع بشكل نقاط =====
const contraindicationsContainer = document.getElementById("medcontraindications");
if (p.contraindications && p.contraindications.length > 0) {
    const ul = document.createElement("ul");
    p.contraindications.forEach(point => {
        const li = document.createElement("li");
        li.textContent = point;
        ul.appendChild(li);
    });
    contraindicationsContainer.innerHTML = ""; // تنظيف أي محتوى سابق
    contraindicationsContainer.appendChild(ul);
} else {
    contraindicationsContainer.textContent = "لا توجد موانع مسجلة لهذا الدواء.";
}


    const qList = document.getElementById("medQuestions");
    qList.innerHTML = "";
    p.questions.forEach((q, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${q.text}
            <label><input type="radio" name="q${i}" value="yes"> نعم</label>
            <label><input type="radio" name="q${i}" value="no"> لا</label>
        `;
        qList.appendChild(li);
    });
}

// ===== حساب النقاط =====
document.getElementById("questionsForm").addEventListener("submit", function(e){
    e.preventDefault();
    let totalScore = 0;
    let allAnswered = true;

    for (let i = 0; i < p.questions.length; i++) {
        const ans = document.querySelector(`input[name="q${i}"]:checked`);
        if (!ans) { allAnswered = false; break; }
        if (ans.value === "yes") totalScore += p.questions[i].score;
    }

    if (!allAnswered) {
        alert("الرجاء الإجابة على جميع الأسئلة.");
        return;
    }

    let alertMsg = "إجمالي النقاط: " + totalScore;

    if (totalScore >= 50) {
        alertMsg += "\n⚠️ خطير: يستدعي الذهاب للطوارئ فورًا!";
    } else if (totalScore >= 6) {
        openDoctorChatPopup();
    } else if (totalScore == 0) {
        alertMsg += "\n✨🤩 لا يوجد أعراض: رائع! استمر بأخذ دوائك.";
    } else {
        alertMsg += "\n✅ خفيف: الأعراض شائعة وتزول غالبًا تلقائيًا.";
    }

    document.getElementById("finalScore").textContent = alertMsg;
});

// ===== عناصر الجرعات =====
const firstDoseHour = document.getElementById("firstDoseHour");
const firstDoseMinute = document.getElementById("firstDoseMinute");
const firstDosePeriod = document.getElementById("firstDosePeriod");
const setFirstDoseBtn = document.getElementById("setFirstDoseBtn");
const medDose = document.getElementById("medDose");
const medNameEl = document.getElementById("medName");

// ===== حاوية الجدول =====
let medSchedule = document.getElementById("medSchedule");
if (!medSchedule) {
    medSchedule = document.createElement("div");
    medSchedule.id = "medSchedule";
    const questionsHeader = document.getElementById("questionsHeader");
    questionsHeader.parentNode.insertBefore(medSchedule, questionsHeader);
}

// ===== Helpers =====
function getLoggedPatientUsername() {
    return localStorage.getItem("patient_username") || null;
}

function getDoseKey(patient, med, dateStr, timeStr) {
    return `dose_${patient}_${med}_${dateStr}_${timeStr}`;
}

// ===== جدول الجرعات لعدة أيام =====
function generateFullSchedule(firstHour, firstMinute, period, dosesPerDay, durationDays) {
    const schedule = [];
    let hour = parseInt(firstHour), minute = parseInt(firstMinute);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    for (let dayOffset = 0; dayOffset < durationDays; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);

        const dateStr = date.toISOString().split('T')[0];
        const doses = [];

        const interval = Math.floor(24 / dosesPerDay);

        for (let i = 0; i < dosesPerDay; i++) {
            let h = (hour + i * interval) % 24;
            let displayHour = h % 12 === 0 ? 12 : h % 12;
            let displayPeriod = h >= 12 ? "PM" : "AM";
            let minStr = minute.toString().padStart(2, "0");
            doses.push({ time: `${displayHour}:${minStr} ${displayPeriod}`, h, m: minute });
        }

        schedule.push({ date, dateStr, doses });
    }

    return schedule;
}

// ===== عرض الجدول =====
function renderFullSchedule(patient, med, scheduleContainer, schedule) {
    scheduleContainer.innerHTML = "";

    const weekCount = Math.ceil(schedule.length / 7);
    for (let w = 0; w < weekCount; w++) {
        const weekDays = schedule.slice(w * 7, w * 7 + 7);

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.marginBottom = "15px";

        const trHead = document.createElement("tr");
        weekDays.forEach(day => {
            const th = document.createElement("th");
            th.textContent = day.date.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'short' });
            th.style.border = "1px solid #ccc";
            th.style.padding = "5px";
            trHead.appendChild(th);
        });
        table.appendChild(trHead);

        const trDose = document.createElement("tr");
        weekDays.forEach(day => {
            const td = document.createElement("td");
            td.style.border = "1px solid #ccc";
            td.style.padding = "5px";

            day.doses.forEach(dose => {
                const key = getDoseKey(patient, med, day.dateStr, dose.time);
                const cb = document.createElement("input");
                cb.type = "checkbox";

                // تحميل القيمة السابقة
                cb.checked = localStorage.getItem(key) === "true";

                // السماح للمريض بتعديل كل الجرعات
                cb.onchange = () => localStorage.setItem(key, cb.checked);

                td.appendChild(cb);
                td.appendChild(document.createTextNode(" " + dose.time));
                td.appendChild(document.createElement("br"));
            });

            trDose.appendChild(td);
        });

        table.appendChild(trDose);
        scheduleContainer.appendChild(table);
    }
}

// ===== تأكيد أول جرعة =====
setFirstDoseBtn.addEventListener("click", () => {
    const hour = firstDoseHour.value;
    const minute = firstDoseMinute.value;
    const period = firstDosePeriod.value;

    const patient = getLoggedPatientUsername();
    const med = medNameEl.textContent.trim();
    if (!hour || !minute || !period || !patient || !med) return;

    medSchedule.innerHTML = "";

    localStorage.setItem(`firstDose_${patient}_${med}`, JSON.stringify({ hour, minute, period }));

    const dosesPerDay = parseInt(medDose.textContent) || 1;
    const duration = parseInt(p.durationDays) || 7;

    const schedule = generateFullSchedule(hour, minute, period, dosesPerDay, duration);
    renderFullSchedule(patient, med, medSchedule, schedule);

    firstDoseHour.parentElement.style.display = "none";
    addChangeFirstDoseBtn();
});

// ===== تحميل الجدول عند فتح الصفحة =====
function loadPatientSchedule() {
    const patient = getLoggedPatientUsername();
    const med = medNameEl.textContent.trim();
    if (!patient || !med) return;

    const saved = localStorage.getItem(`firstDose_${patient}_${med}`);
    if (saved) {
        const { hour, minute, period } = JSON.parse(saved);

        firstDoseHour.value = hour;
        firstDoseMinute.value = minute;
        firstDosePeriod.value = period;

        firstDoseHour.parentElement.style.display = "none";

        const dosesPerDay = parseInt(medDose.textContent) || 1;
        const duration = parseInt(p.durationDays) || 7;

        const schedule = generateFullSchedule(hour, minute, period, dosesPerDay, duration);
        renderFullSchedule(patient, med, medSchedule, schedule);

        addChangeFirstDoseBtn();
    }
}
loadPatientSchedule();

// ===== زر تغيير أول جرعة =====
function addChangeFirstDoseBtn() {
    const med = medNameEl.textContent.trim();

    let btn = document.getElementById("changeFirstDoseBtn");
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "changeFirstDoseBtn";
        btn.textContent = "تغيير أول جرعة";
        btn.style.marginTop = "10px";
        medSchedule.insertBefore(btn, medSchedule.firstChild);
    }

    // تعطيل الزر فقط لأدوية فالبروات / Valproate / Depakine
    if (med.includes("Valproate") || med.includes("Depakine") || med.includes("فالبروات")) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
        return;
    }

    // باقي الأدوية: الزر شغال
    btn.onclick = () => {
        firstDoseHour.parentElement.style.display = "flex";
    };
}
