/* global google */
import React, { useEffect, useRef, useState } from "react";

export default function GoogleMap() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);
    const [userPos, setUserPos] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    useEffect(() => {
        const initMap = async () => {
            const { Map } = await google.maps.importLibrary("maps");
            const { Marker } = await google.maps.importLibrary("marker");

            const map = new Map(mapRef.current, {
                center: { lat: 38.788853, lng: 20.721518 },
                zoom: 13,
                mapTypeId: "satellite",
                disableDefaultUI: true,
                zoomControl: true,
                minZoom: 7,
                maxZoom: 15,
            });

            const allowedBounds = {
                north: 38.82,
                south: 38.60,
                west: 20.67,
                east: 20.81,
            };

            map.setOptions({
                latLngBounds: allowedBounds,
                strictBounds: false,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,

                },
            });

            mapInstanceRef.current = map;

            // ✅ Add static custom markers
            const locations = [
                {
                    name: "Diavlos Marine",
                    position: { lat: 38.788853, lng: 20.721518 },
                    icon: { url: "/icons/Limani.png", scaledSize: new google.maps.Size(42, 42) },
                },
                {
                    name: "Vathiavali Beach",
                    position: { lat: 38.76418558916113, lng: 20.789713587619833 },
                    icon: { url: "/icons/beach.png", scaledSize: new google.maps.Size(40, 40) },
                },
                {
                    name: "Papanikolis Cave",
                    position: { lat: 38.6148442212325, lng: 20.759276148506192 },
                    icon: {
                        url: "https://cdn-icons-png.flaticon.com/512/616/616554.png",
                        scaledSize: new google.maps.Size(40, 40),
                    },
                },
                {
                    name: "Karnagio Restaurant",
                    position: { lat: 38.665472594390145, lng: 20.777818493575722 },
                    icon: {
                        url: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
                        scaledSize: new google.maps.Size(40, 40),
                    },
                },
            ];

            locations.forEach((loc) => {
                const marker = new Marker({
                    position: loc.position,
                    map,
                    title: loc.name,
                    icon: loc.icon,
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="font-size:14px; font-weight:600;">${loc.name}</div>`,
                });

                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });
            });

            // ✅ Setup user marker (GPS)
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

        // Load Google Maps
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
    }, []);

    // ✅ Watch GPS position
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

                // update marker position
                if (userMarkerRef.current) {
                    userMarkerRef.current.setPosition({ lat, lng });
                }
            },
            (err) => setGpsError(err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    // ✅ Recenter map on user position
    const handleCenterOnUser = () => {
        if (mapInstanceRef.current && userPos) {
            mapInstanceRef.current.panTo(userPos);
            mapInstanceRef.current.setZoom(15);
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            {/* Google Map */}
            <div
                ref={mapRef}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                }}
            />

            {/* Floating My Location button */}
            <button
                onClick={handleCenterOnUser}
                style={{
                    position: "absolute",
                    bottom: "140px",
                    right: "20px",
                    padding: "10px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "white",
                    background: "linear-gradient(to right, #4a00e0, #8e2de2)",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    zIndex: 9999,
                }}
            >
                📍 My Location
            </button>

            {/* GPS Error Message */}
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