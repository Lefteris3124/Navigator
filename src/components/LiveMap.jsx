// src/components/LiveMap.jsx
/* global google */
import React, { useEffect, useRef } from "react";

export default function LiveMap({ users }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        const initMap = async () => {
            const { Map } = await google.maps.importLibrary("maps");
            const map = new Map(mapRef.current, {
                mapId: "76e918191ebb4fda13ec7338", // your custom Map ID
                center: { lat: 38.788, lng: 20.721 },
                zoom: 11,
                mapTypeId: "satellite",
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: "auto", // allows scroll + drag
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

    // 🧩 Update markers whenever the user list changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        if (users.length === 0) return;

        const bounds = new google.maps.LatLngBounds();

        users.forEach((user) => {
            if (!user.latitude || !user.longitude) return;

            let color = "#00cc66"; // active = green
            if (user.status === "emergency") color = "#ff3333";
            else if (user.status === "inactive") color = "#888888";

            const marker = new google.maps.Marker({
                position: { lat: Number(user.latitude), lng: Number(user.longitude) },
                map,
                title: `User ${user.session_id}`,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
    <div class="user-info-window">
      <div class="info-header">
        <strong>Active User</strong>
      </div>
      <div class="info-body">
        <div><b>Session:</b> ${user.session_id}</div>
        <div><b>Status:</b> ${user.status}</div>
        <div><b>Last seen:</b> ${new Date(user.last_seen).toLocaleTimeString()}</div>
      </div>
    </div>
  `,
                pixelOffset: new google.maps.Size(0, -15), // 👈 moves popup *above* pin
            });

            marker.addListener("click", () => infoWindow.open(map, marker));
            markersRef.current.push(marker);
            bounds.extend(marker.getPosition());
        });

        if (users.length > 0) {
            map.fitBounds(bounds, 60);
        }
    }, [users]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Live Tracking</h2>
                </div>
                <div className="flex items-center gap-1 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">{users.length} Active</span>
                </div>
            </div>

            <div className="relative" style={{ height: "70vh" }}>
                <div ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
            </div>
        </div>
    );
}