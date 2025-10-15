// src/utils/activeUsers.js
import { supabase } from "../lib/supabase";

export async function updateActiveUser(sessionId, userLat, userLng) {
    try {
        const payload = {
            session_id: sessionId,
            latitude: Number(userLat),
            longitude: Number(userLng),
            status: "active",
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        console.log("📤 Sending payload to Supabase:", payload);

        const { data, error } = await supabase
            .from("active_users")
            .upsert([payload], { onConflict: ["session_id"] });

        if (error) {
            console.error("❌ Error updating user:", error);
        } else {
            console.log("✅ User upserted:", data);
        }
    } catch (err) {
        console.error("🔥 Unexpected error in updateActiveUser:", err);
    }
}