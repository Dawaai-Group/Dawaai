// sw.js (Service Worker)

self.addEventListener("install", event => {
    console.log("Service Worker: Installed");
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    console.log("Service Worker: Activated");
    return self.clients.claim();
});

self.addEventListener("message", event => {
    const { med, doseTime } = event.data;

    self.registration.showNotification("تذكير: وقت جرعة الدواء", {
        body: `${med} - الآن ${doseTime}`,
        icon: "pill-icon.png"
    });
});
