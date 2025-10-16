/* global google */
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

export default function LiveMap({ users }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const openInfoWindowRef = useRef(null);
    const [showInactive, setShowInactive] = useState(true);

    // 🆔 Ensure each client has a session ID
    const sessionId = localStorage.getItem("session_id") || uuidv4();
    localStorage.setItem("session_id", sessionId);

    // 🌍 Send periodic location + heartbeat updates
    useEffect(() => {
        const sendHeartbeat = async () => {
            if (!("geolocation" in navigator)) {
                console.warn("Geolocation not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const latitude = pos.coords.latitude;
                    const longitude = pos.coords.longitude;

                    // ✅ skip invalid coordinates
                    if (!latitude || !longitude) {
                        console.warn("Invalid coordinates — skipping update");
                        return;
                    }

                    await supabase
                        .from("active_users")
                        .upsert(
                            {
                                session_id: sessionId,
                                latitude,
                                longitude,
                                last_seen: new Date().toISOString(),
                                status: "active",
                                updated_at: new Date().toISOString(),
                            },
                            { onConflict: "session_id" }
                        );
                },
                (err) => {
                    console.error("Geolocation error:", err.message);
                    // Optional: update status to inactive if denied
                },
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
            );
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 30_000);

        const handleUnload = async () => {
            await supabase
                .from("active_users")
                .update({ status: "inactive" })
                .eq("session_id", sessionId);
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [sessionId]);

    // 🗺️ Initialize the map
    useEffect(() => {
        const initMap = async () => {
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

            const map = new Map(mapRef.current, {
                mapId: "76e918191ebb4fda13ec7338",
                center: { lat: 38.788, lng: 20.721 },
                zoom: 11,
                mapTypeId: "satellite",
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: "auto",
            });

            // ✅ Close any open popup when clicking on the map
            map.addListener("click", () => {
                if (openInfoWindowRef.current) {
                    openInfoWindowRef.current.close();
                    openInfoWindowRef.current = null;
                }
            });

            mapInstanceRef.current = map;
        };

        if (window.google && google.maps) {
            initMap();
        } else {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&v=weekly`;
            script.async = true;
            script.defer = true;
            script.onload = initMap;
            document.head.appendChild(script);
        }
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach((m) => (m.map = null));
        markersRef.current = [];

        if (!users || users.length === 0) return;

        // ✅ Declare these before the loop
        const bounds = new google.maps.LatLngBounds();
        const newMarkers = [];

        users.forEach((user) => {
            if (!user.latitude || !user.longitude) return;
            if (user.status === "inactive" && !showInactive) return;

            let color = "#00cc66";
            if (user.status === "emergency") color = "#ff3333";
            else if (user.status === "inactive") color = "#888888";

            // Base position
            let lat = Number(user.latitude);
            let lng = Number(user.longitude);

            // ✅ Check for duplicates
            const duplicates = users.filter(
                (u) =>
                    Number(u.latitude) === Number(user.latitude) &&
                    Number(u.longitude) === Number(user.longitude)
            );
            const index = duplicates.findIndex(
                (u) => u.session_id === user.session_id
            );
            const total = duplicates.length;

            // ✅ Spread identical users in a small ring
            if (total > 1) {
                const radius = 0.000020;
                const angle = (index / total) * 2 * Math.PI;
                lat += Math.cos(angle) * radius;
                lng += Math.sin(angle) * radius;
            }

            // Marker element
            const markerDiv = document.createElement("div");
            markerDiv.style.width = "14px";
            markerDiv.style.height = "14px";
            markerDiv.style.borderRadius = "50%";
            markerDiv.style.border = "2px solid white";
            markerDiv.style.backgroundColor = color;
            markerDiv.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: { lat, lng },
                title: `User ${user.session_id}`,
                content: markerDiv,
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
        <div class="user-info-window">
          <div class="info-header" style="font-weight:bold;color:${
                    user.status === "inactive"
                        ? "#888"
                        : user.status === "emergency"
                            ? "#e63946"
                            : "#00cc66"
                };">
            ${
                    user.status === "inactive"
                        ? "Inactive User"
                        : user.status === "emergency"
                            ? "Emergency User"
                            : "Active User"
                }
          </div>
          <div class="info-body">
            <div><b>Session:</b> ${user.session_id}</div>
            <div><b>Status:</b> ${user.status}</div>
            <div><b>Last seen:</b> ${new Date(
                    user.last_seen
                ).toLocaleTimeString()}</div>
          </div>
        </div>
      `,
                pixelOffset: new google.maps.Size(0, -15),
            });

            marker.addListener("click", () => {
                if (openInfoWindowRef.current) openInfoWindowRef.current.close();
                infoWindow.open(map, marker);
                openInfoWindowRef.current = infoWindow;
            });

            // ✅ push and extend bounds
            newMarkers.push(marker);
            bounds.extend(marker.position);
        });

        // Fit map to show all visible markers
        if (newMarkers.length > 0) {
            map.fitBounds(bounds, 60);
        }

        markersRef.current = newMarkers;
    }, [users, showInactive]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Live Tracking</h2>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    {/* ✅ Cyberpunk checkbox toggle */}
                    <label className="cyberpunk-checkbox-label">
                        <input
                            type="checkbox"
                            className="cyberpunk-checkbox"
                            checked={showInactive}
                            onChange={() => setShowInactive(!showInactive)}
                        />
                        <span>Show inactive</span>
                    </label>

                    {/* ✅ Active users counter */}
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600">
              {users.filter((u) => u.status === "active").length} Active
            </span>
                    </div>
                </div>
            </div>

            <div className="relative" style={{ height: "70vh" }}>
                <div ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
            </div>
        </div>
    );
}