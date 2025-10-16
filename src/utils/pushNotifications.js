export async function registerPushNotifications(sessionId) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("🚫 Push notifications not supported in this browser.");
        return;
    }

    if (!sessionId) {
        console.error("❌ Missing sessionId — cannot register push notifications.");
        return;
    }

    try {
        // ✅ Step 1: Register or reuse service worker
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        await navigator.serviceWorker.ready;
        console.log("✅ Service Worker registered and ready.");

        // ✅ Step 2: Ask for permission to send notifications
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("🚫 Notification permission denied by user.");
            return;
        }

        // ✅ Step 3: Check if a push subscription already exists
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.error("❌ Missing VAPID public key in environment variables");
                return;
            }

            const applicationServerKey = urlBase64ToUint8Array(vapidKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            console.log("📡 New push subscription created:", subscription.toJSON());
        } else {
            console.log("♻️ Existing push subscription found:", subscription.endpoint);
        }

        // ✅ Step 4: Convert and prepare data
        const subJSON = subscription.toJSON();
        const payload = {
            session_id: sessionId,
            subscription: subJSON,
        };

        console.log("📨 Sending subscription to Supabase:", payload);

        // ✅ Step 5: Send to Supabase Edge Function
        const response = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/save-subscription`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            console.error("❌ Failed to save subscription:", await response.text());
        } else {
            console.log("✅ Subscription saved successfully for session:", sessionId);
        }
    } catch (err) {
        console.error("❌ Error registering push notifications:", err);
    }
}

// 🔧 Utility function to convert VAPID key
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