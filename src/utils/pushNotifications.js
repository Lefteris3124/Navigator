export async function registerPushNotifications(userId) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push notifications not supported");
        return;
    }

    // ✅ Step 1: Register the service worker
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.log("✅ Service Worker registered:", registration);

    // ✅ Step 2: Wait until it's active
    const readyRegistration = await navigator.serviceWorker.ready;
    console.log("✅ Service Worker is active and ready:", readyRegistration);

    // ✅ Step 3: Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.warn("🚫 Notification permission denied");
        return;
    }

    // ✅ Step 4: Subscribe to push
    const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
        console.error("❌ Missing VAPID public key in environment variables");
        return;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
    });

    console.log("📡 Push subscription created:", subscription);

    // ✅ Step 5: Send to Supabase Edge Function
    const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/save-subscription`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                subscription,
            }),
        }
    );

    if (!response.ok) {
        console.error("❌ Failed to save subscription:", await response.text());
    } else {
        console.log("✅ Subscription saved successfully");
    }
}

// Utility function for key conversion
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}