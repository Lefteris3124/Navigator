/* global google */
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { getOrCreateSessionId } from "./utils/session";
import { updateActiveUser } from "./utils/activeUsers";

export default function GoogleMap() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);
    const [userPos, setUserPos] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    const sessionId = getOrCreateSessionId();

    useEffect(() => {
        // Disable scrolling on this page
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        return () => {
            // Restore scrolling when leaving this page
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        };
    }, []);



    useEffect(() => {
        const initMap = async () => {
            const { Map } = await google.maps.importLibrary("maps");
            const { Marker } = await google.maps.importLibrary("marker");

            const map = new Map(mapRef.current, {
                mapId: "76e918191ebb4fda13ec7338",
                center: { lat: 38.788853, lng: 20.721518 },
                mapTypeId: "satellite",
                zoom: 13,
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                },
                restriction: {
                    latLngBounds: {
                        north: 38.87,
                        south: 38.56,
                        west: 20.61,
                        east: 20.87,
                    },
                    strictBounds: false,
                },
            });

            mapInstanceRef.current = map;



            // ✅ Marker data
            const locations = [
                {
                    name: "Diavlos Marine",
                    lat: 38.788132428014464,
                    lng: 20.72020519077176,
                    description: "Your Starting Point.",
                    type: "Marina",
                    difficulty: "Easy",
                    stay: "",
                    color: "#55b8ef",
                    emoji: "⚓",
                },
                {
                    name: "Vathiavali Beach",
                    lat: 38.76331974241167,
                    lng: 20.788981684254974,
                    description: "Calm waters, great for swimming, has road access and beach bar.",
                    type: "Beach",
                    difficulty: "Easy",
                    stay: "2 hours",
                    color: "#0077ff",
                    emoji: "🏖️",
                },
                {
                    name: "Gerakas Beach",
                    lat: 38.75719808045438,
                    lng: 20.767915020459796,
                    description: "Calm waters, no road access, more private.",
                    type: "Beach",
                    difficulty: "Easy",
                    stay: "2 hours",
                    color: "#0077ff",
                    emoji: "🏖️",
                },
                {
                    name: "Papanikolis Cave",
                    lat: 38.614138645126936,
                    lng: 20.762608511962913,
                    description: "Sea-cave best in calm seas, Cant use anchor inside",
                    type: "Beach",
                    difficulty: "Easy",
                    stay: "30 minutes",
                    color: "#c043ed",
                    emoji: "🕳️",
                },
                {
                    name: "Karnagio Restaurant",
                    lat: 38.665472594390145,
                    lng: 20.777818493575722,
                    description: "Great lunch stop, beach next to it.",
                    type: "Restaurant",
                    difficulty: "Easy",
                    stay: "2 hours",
                    color: "#ffa400",
                    emoji: "🍴",
                },
            ];


            function smoothZoomAndPan(map, targetLatLng, targetZoom = 15, duration = 800) {
                const startZoom = map.getZoom();
                const startCenter = map.getCenter();

                // ✅ Normalize input — handle both LatLng objects and plain objects
                const target = targetLatLng.lat ? targetLatLng : {
                    lat: targetLatLng.lat(),
                    lng: targetLatLng.lng(),
                };

                const startLat = startCenter.lat();
                const startLng = startCenter.lng();
                const endLat = target.lat;
                const endLng = target.lng;
                const zoomDiff = targetZoom - startZoom;
                const startTime = performance.now();

                const ease = (t) => 1 - Math.pow(1 - t, 3);

                function animate() {
                    const now = performance.now();
                    const progress = Math.min((now - startTime) / duration, 1);
                    const eased = ease(progress);

                    const newLat = startLat + (endLat - startLat) * eased;
                    const newLng = startLng + (endLng - startLng) * eased;
                    const newZoom = startZoom + zoomDiff * eased;

                    map.setCenter({ lat: newLat, lng: newLng });
                    map.setZoom(newZoom);

                    if (progress < 1) requestAnimationFrame(animate);
                }

                requestAnimationFrame(animate);
            }

            let openInfoWindow = null;

// ✅ Loop through all markers
            locations.forEach((loc) => {
                // Create the main pin element
                const pinDiv = document.createElement("div");
                pinDiv.className = "custom-pin";
                pinDiv.style.backgroundColor = loc.color || "#0077ff";
                if (loc.emoji) pinDiv.innerHTML = `<div class="emoji">${loc.emoji}</div>`;

                // Create a wrapper for pin + tooltip
                const wrapper = document.createElement("div");
                wrapper.className = "marker-wrapper";
                wrapper.appendChild(pinDiv);

                // Tooltip element
                const tooltip = document.createElement("div");
                tooltip.className = "marker-tooltip";
                tooltip.textContent = loc.name;
                wrapper.appendChild(tooltip);



                // Create the AdvancedMarkerElement
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat: loc.lat, lng: loc.lng },
                    title: loc.name,
                    content: wrapper,
                });

                // Info window content
                const content = `
      <div class="card info-card">
        <div class="top-section">
          <div class="info">
            <div class="info-1">${loc.name}</div>
            <div class="info-2">${loc.type}</div>
          </div>
        </div>
        <div class="content-1">${loc.description}</div>
        <div class="bottom-row">
          <div class="pill difficulty">Difficulty: ${loc.difficulty}</div>
          ${loc.stay ? `<div class="pill stay">Stay: ${loc.stay}</div>` : ""}
        </div>
      </div>
    `;

                const infoWindow = new google.maps.InfoWindow({
                    content,
                    maxWidth: 280,
                });

                // Click logic
                marker.addListener("click", () => {
                    if (openInfoWindow) openInfoWindow.close();

                    // 🧭 Smoothly zoom & pan toward the marker
                    const currentZoom = map.getZoom();
                    const targetZoom = Math.max(currentZoom, 15); // zoom in if too far
                    smoothZoomAndPan(map, { lat: loc.lat, lng: loc.lng }, targetZoom);


                    setTimeout(() => {
                        infoWindow.open(map, marker);
                        openInfoWindow = infoWindow;
                    }, 400);
                });

                map.addListener("click", () => {
                    if (openInfoWindow) {
                        openInfoWindow.close();
                        openInfoWindow = null;
                    }
                });
            });

            //  User marker
            userMarkerRef.current = new Marker({
                map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
            });
        };

        //  Load script once
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

    //GPS TRACK
    useEffect(() => {


        if (!navigator.geolocation) {
            setGpsError("Geolocation not supported");
            return;
        }

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserPos({ lat, lng });

                //console.log("📍 GPS position:", lat, lng);
                //console.log("🆔 Session ID:", sessionId);

                if (userMarkerRef.current)
                    userMarkerRef.current.setPosition({ lat, lng });


                updateActiveUser(sessionId, lat, lng);
            },
            (err) => setGpsError(err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    const handleCenterOnUser = () => {
        if (mapInstanceRef.current && userPos) {
            mapInstanceRef.current.panTo(userPos);
            mapInstanceRef.current.setZoom(15);
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            <button className="cssbuttons-2 mylocation-btn" onClick={handleCenterOnUser}>
        <span className="btn-content">
          📍 My Location
        </span>
            </button>
            {gpsError && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "20px",
                        left: "20px",
                        padding: "10px 14px",
                        background: "rgba(255,0,0,0.8)",
                        color: "white",
                        borderRadius: "8px",
                        fontSize: "13px",
                        zIndex: 9999,
                    }}
                >
                    ⚠️ {gpsError}
                </div>
            )}
        </div>
    );
}