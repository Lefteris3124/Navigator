/* global google */
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { getOrCreateSessionId } from "./utils/session";
import { updateActiveUser } from "./utils/activeUsers";
import PlaceInfoWindow from "./PlaceInfoWindow"; // ← your React bottom sheet

export default function GoogleMap() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const userMarkerRef = useRef(null);

    // React State
    const [userPos, setUserPos] = useState(null);
    const [gpsError, setGpsError] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const sessionId = getOrCreateSessionId();

    // Prevent body scrolling
    useEffect(() => {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        };
    }, []);

    useEffect(() => {
        const initMap = async () => {
            const { Map } = await google.maps.importLibrary("maps");
            const { Marker } = await google.maps.importLibrary("marker");
            const { PlacesService } = await google.maps.importLibrary("places");

            const map = new Map(mapRef.current, {
                mapId: "76e918191ebb4fda13ec7338",
                center: { lat: 38.788853, lng: 20.721518 },
                zoom: 13,
                mapTypeId: "satellite",
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
                restriction: {
                    latLngBounds: {
                        north: 38.87,
                        south: 38.56,
                        west: 20.61,
                        east: 20.87,
                    },
                },
            });

            mapInstanceRef.current = map;
            const placesService = new PlacesService(map);

            // ---------------- LOCATIONS ----------------
            const locations = [
                {
                    name: "Diavlos Marine",
                    lat: 38.788132428014464,
                    lng: 20.72020519077176,
                    placeId: "ChIJW-AXFIc1XBMRsLO6zO1n8Do",
                    description: "Your Starting Point.",
                    type: "Marina",
                    hours: "9AM - 10PM",
                },
                {
                    name: "Vathiavali Beach",
                    lat: 38.76331974241167,
                    lng: 20.788981684254974,
                    placeId: "ChIJzdJiEJQ0XBMRb4qKBb1VCqM",
                    description: "Calm waters, great for swimming.",
                    type: "Beach",
                    hours: "All Day",
                    phone: "+30 697 771 7734"
                },
                {
                    name: "Gerakas Beach",
                    lat: 38.75719808045438,
                    lng: 20.767915020459796,
                    description: "Calm waters, no road access.",
                    type: "Beach",
                    hours: "All Day",
                    photos: [
                        "/custom_photos/gerakas1.jpg",
                        "/custom_photos/gerakas2.jpg",
                        "/custom_photos/gerakas3.jpg"
                    ],
                },
                {
                    name: "Papanikolis Cave",
                    lat: 38.614138645126936,
                    lng: 20.762608511962913,
                    placeId: "ChIJC3LsK_jIXRMRIUN_-G6f3P8",
                    description: "Sea-cave best in calm seas.",
                    type: "Cave",
                    hours: "Dont go after 3PM",
                },
                {
                    name: "Karnagio Restaurant",
                    lat: 38.665472594390145,
                    lng: 20.777818493575722,
                    placeId: "ChIJFe3gNeTLXRMRZLQCn4CCW_g",
                    description: "Great lunch stop.",
                    type: "Restaurant",
                    hours: "8AM - 11PM",
                    phone: "+30 26450 51071"
                },
            ];

            // ---------------- ICON MAP ----------------
            const customIcons = {
                Marina: "/icons/anchor3.png",
                Beach: "/icons/beach3.png",
                Restaurant: "/icons/restaurant3.png",
                Cave: "/icons/cave3.png",
                Danger: "/icons/danger3.png",
            };

            // Smooth zoom function (recursive)
            function smoothZoom(map, targetZoom, currentZoom) {
                if (currentZoom === targetZoom) return;

                const step = targetZoom > currentZoom ? 1 : -1;

                const listener = google.maps.event.addListener(map, "zoom_changed", () => {
                    google.maps.event.removeListener(listener);
                    smoothZoom(map, targetZoom, currentZoom + step);
                });

                setTimeout(() => {
                    map.setZoom(currentZoom + step);
                }, 80);
            }

// Combined pan + smooth zoom function
            function smoothZoomAndPan(map, targetLatLng, targetZoom = 15) {
                map.panTo(targetLatLng); // smoother than setCenter
                const currentZoom = map.getZoom();
                smoothZoom(map, targetZoom, currentZoom);
            }

            function smoothZoomToMarker(map, marker, targetZoom = 15) {
                const position = marker.getPosition();

                // Smooth pan
                map.panTo(position);

                // Smooth zoom handled natively by API
                map.setZoom(targetZoom);
            }

            // ---------------- LOAD PLACE DETAILS ----------------
            function loadPlaceData(loc) {
                // If Google Place ID exists → fetch details
                if (loc.placeId) {
                    const request = {
                        placeId: loc.placeId,
                        fields: [
                            "name",
                            "formatted_phone_number",
                            "rating",
                            "user_ratings_total",
                            "photos",
                            "website",
                        ],
                    };

                    placesService.getDetails(request, (place, status) => {
                        if (status !== google.maps.places.PlacesServiceStatus.OK) {
                            console.warn("Failed GP info, using local only.");
                            loadLocalData(loc);
                            return;
                        }

                        const photoUrls = place.photos
                            ? place.photos.map((p) =>
                                p.getUrl({ maxWidth: 1200, maxHeight: 800 })
                            )
                            : [];

                        const merged = {
                            name: place.name ?? loc.name,
                            category: loc.type,
                            description: loc.description,
                            priceLevel: loc.priceLevel ?? "",
                            address: place.formatted_address ?? "",
                            phone: loc.phone ?? place.formatted_phone_number ?? "",
                            website: place.website ?? "",
                            rating: place.rating ?? null,
                            reviewCount: place.user_ratings_total ?? 0,
                            photos: photoUrls.length > 0 ? photoUrls : loc.photos ?? [],
                            hours: loc.hours ?? "",
                            distance: loc.distance ?? "",
                        };

                        setSelectedPlace(merged);
                        setIsInfoOpen(true);
                    });
                } else {
                    // No placeId → local data only
                    loadLocalData(loc);
                }
            }

            function loadLocalData(loc) {
                const merged = {
                    name: loc.name,
                    category: loc.type,
                    description: loc.description,
                    priceLevel: "",
                    address: loc.address ?? "",
                    phone: loc.phone ?? "",
                    website: loc.website ?? "",
                    rating: loc.rating ?? null,
                    reviewCount: loc.reviewCount ?? 0,
                    photos: loc.photos ?? [],
                    hours: loc.hours ?? "",
                    distance: loc.distance ?? "",
                };

                setSelectedPlace(merged);
                setIsInfoOpen(true);
            }

            // ---------------- CREATE MARKERS ----------------
            locations.forEach((loc) => {
                const marker = new Marker({
                    map,
                    position: { lat: loc.lat, lng: loc.lng },
                    icon: {
                        url: customIcons[loc.type],
                        scaledSize: new google.maps.Size(52, 52),
                        anchor: new google.maps.Point(26, 52),
                    },
                });

                // ----- CUSTOM LABEL UNDER THE MARKER -----
                const labelDiv = document.createElement("div");
                labelDiv.className = "map-label";
                labelDiv.innerText = loc.name;

                const labelOverlay = new google.maps.OverlayView();
                labelOverlay.onAdd = function () {
                    const pane = this.getPanes().overlayImage;
                    pane.appendChild(labelDiv);
                };
                labelOverlay.draw = function () {
                    const projection = this.getProjection();
                    const pos = projection.fromLatLngToDivPixel(
                        new google.maps.LatLng(loc.lat, loc.lng)
                    );
                    labelDiv.style.position = "absolute";
                    labelDiv.style.left = pos.x - labelDiv.offsetWidth / 2 + "px";
                    labelDiv.style.top = pos.y + 10 + "px";  // distance below the pin
                };
                labelOverlay.onRemove = function () {
                    labelDiv.remove();
                };
                labelOverlay.setMap(map);

                // Click → Load React Info Window
                marker.addListener("click", () => {
                    smoothZoomToMarker(map, marker, 15);
                    loadPlaceData(loc);
                });
            });

            // ---------------- USER MARKER ----------------
            userMarkerRef.current = new Marker({
                map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2,
                },
            });
        };

        // Load Google Maps
        if (window.google && google.maps) {
            initMap();
        } else {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
            script.async = true;
            script.onload = initMap;
            document.head.appendChild(script);
        }
    }, []);

    // ---------------- GPS TRACKING ----------------
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

                if (userMarkerRef.current)
                    userMarkerRef.current.setPosition({ lat, lng });

                updateActiveUser(sessionId, lat, lng);
            },
            (err) => setGpsError(err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    // Center on user button
    const handleCenterOnUser = () => {
        if (mapInstanceRef.current && userPos) {
            mapInstanceRef.current.panTo(userPos);
            mapInstanceRef.current.setZoom(15);
        }
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            {/* User Location Button */}
            <button className="cssbuttons-2 mylocation-btn" onClick={handleCenterOnUser}>
                <span className="btn-content">📍 My Location</span>
            </button>

            {/* GPS Error */}
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

            {/* React Bottom-Sheet Info Window */}
            <PlaceInfoWindow
                place={selectedPlace}
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
            />
        </div>
    );
}
