import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Circle, Tooltip, Polygon } from 'react-leaflet';
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {Anchor, ChevronRight, Navigation} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ---- marker icon fix ----
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 👉 Center of allowed rectangle (your coords)
const CENTER = [38.715482, 20.755199];

// 👉 Size of the allowed rectangle (editable)
const halfWidthMeters = 4500;   // left/right from center
const halfHeightMeters = 8500;  // up/down from center

// Map will start here too (your marina)
const MARINA_LOCATION = [38.78885339128394, 20.72151825153614];

// ---------------- helpers ----------------


// Smaller/customizable divIcon
const createCustomIcon = (color, emoji, size = 22) =>
    L.divIcon({
        className: 'leaflet-div-icon custom-marker',
        html: `
      <div class="pin" style="background:${color}">
        <div class="glyph">${emoji}</div>
      </div>
    `,
        iconSize: [size, size],                     // controls actual pixel size
        iconAnchor: [Math.round(size / 2), size],   // tip at bottom center
    });

// Bearing in degrees (0=N, CW) using local meter projection
function bearingBetween(p1, p2) {
    const [lat1, lng1] = p1;
    const [lat2, lng2] = p2;

    // Convert delta lon/lat to meters around the mid-latitude
    const midLat = (lat1 + lat2) / 2;
    const dx = (lng2 - lng1) * metersPerDegLng(midLat); // meters east
    const dy = (lat2 - lat1) * metersPerDegLat;         // meters north

    // Heading: atan2(East, North). 0=N, 90=E, 180=S, 270=W
    const angleDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
    return (angleDeg + 360) % 360;
}



function smoothAngle(prev, next, alpha = 0.75) {
    if (prev == null) return next;
    let delta = next - prev;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const absDelta = Math.abs(delta);
    const k = absDelta > 45 ? 1 : alpha; // snap on sharp turns
    return (prev + k * delta + 360) % 360;
}

function useCourseHeading(
    userPos,
    { minMoveMeters = 2, minIntervalMs = 300, smoothAlpha = 0.75 } = {}
) {
    const prevRef = React.useRef(null); // { pos:[lat,lng], t:number }
    const [course, setCourse] = useState(null);

    useEffect(() => {
        if (!userPos) return;
        const now = Date.now();
        const prev = prevRef.current;

        if (!prev) {
            prevRef.current = { pos: userPos, t: now };
            return;
        }

        const dt = now - prev.t;
        if (dt < minIntervalMs) return;

        // distance using same local projection for consistency
        const midLat = (prev.pos[0] + userPos[0]) / 2;
        const dx = (userPos[1] - prev.pos[1]) * metersPerDegLng(midLat);
        const dy = (userPos[0] - prev.pos[0]) * metersPerDegLat;
        const distM = Math.hypot(dx, dy);
        if (distM < minMoveMeters) return;

        const raw = bearingBetween(prev.pos, userPos);
        setCourse((c) => smoothAngle(c, raw, smoothAlpha));
        prevRef.current = { pos: userPos, t: now };
    }, [userPos, minIntervalMs, minMoveMeters, smoothAlpha]);

    return course;
}

const getDifficultyColor = (d) => ({ Easy:'#10b981', Moderate:'#f59e0b', Hard:'#ef4444' }[d] || '#6b7280');

// meters/degree helpers at a given latitude
const metersPerDegLat = 111320;
const metersPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

// Build rectangle bounds from center + half sizes (Leaflet expects [[SW],[NE]])
function rectBoundsFromCenter([lat, lng], halfWm, halfHm) {
    const dLat = halfHm / metersPerDegLat;
    const dLng = halfWm / metersPerDegLng(lat);
    const sw = [lat - dLat, lng - dLng];
    const ne = [lat + dLat, lng + dLng];
    return [sw, ne];
}

const ALLOWED_RECT = rectBoundsFromCenter(CENTER, halfWidthMeters, halfHeightMeters);

// Check if point is inside rectangle bounds
function pointInRect([lat, lng], [[swLat, swLng], [neLat, neLng]]) {
    return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
}

// Distance (approx meters) to nearest rectangle edge
function distanceToRectEdgeMeters([lat, lng], [[swLat, swLng], [neLat, neLng]]) {
    const mLat = metersPerDegLat;
    const mLng = metersPerDegLng((swLat + neLat) / 2);

    // Convert to local meters (origin at center)
    const cLat = (swLat + neLat) / 2;
    const cLng = (swLng + neLng) / 2;
    const x = (lng - cLng) * mLng; // meters east
    const y = (lat - cLat) * mLat; // meters north

    const halfW = (neLng - cLng) * mLng;  // meters
    const halfH = (neLat - cLat) * mLat;  // meters

    const dx = Math.max(Math.abs(x) - halfW, 0);
    const dy = Math.max(Math.abs(y) - halfH, 0);
    if (dx === 0 && dy === 0) {
        const distToVertical = halfW - Math.abs(x);
        const distToHorizontal = halfH - Math.abs(y);
        return Math.min(distToVertical, distToHorizontal);
    }
    return Math.hypot(dx, dy);
}

// Build a direction cone (fan) in lat/lng from heading and radius
function buildHeadingCone([lat, lng], headingDeg, radiusM = 200, fovDeg = 70, steps = 28) {
    const mPerLat = metersPerDegLat;
    const mPerLng = metersPerDegLng(lat);

    const pts = [[lat, lng]];
    const start = headingDeg - fovDeg / 2;
    const end = headingDeg + fovDeg / 2;
    const step = fovDeg / steps;

    for (let a = start; a <= end; a += step) {
        const rad = (a * Math.PI) / 180;
        // y -> North, x -> East
        const dLat = (Math.cos(rad) * radiusM) / mPerLat;
        const dLng = (Math.sin(rad) * radiusM) / mPerLng;
        pts.push([lat + dLat, lng + dLng]);
    }
    pts.push([lat, lng]); // close fan
    return pts;
}

// UI spacing for the Info button + panel
const TOGGLE_BOTTOM = 50;   // px
const PANEL_OFFSET = 56;    // px

// ---- padded drag bounds (in meters) ----
const DRAG_PAD_METERS = 8000;

function padRectMeters([[swLat, swLng], [neLat, neLng]], padM) {
    const midLat = (swLat + neLat) / 2;
    const dLat = padM / metersPerDegLat;
    const dLng = padM / metersPerDegLng(midLat);
    return [
        [swLat - dLat, swLng - dLng],
        [neLat + dLat, neLng + dLng],
    ];
}

// Build a bounds rect that includes the allowed rect + all suggested markers
function boundsFromPoints(points) {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of points) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
    }
    return [[minLat, minLng], [maxLat, maxLng]];
}

// geolocate
function Geolocate({ onUpdate }) {
    const watchIdRef = useRef(null);
    useEffect(() => {
        if (!navigator.geolocation) return;
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => onUpdate([pos.coords.latitude, pos.coords.longitude]),
            () => onUpdate(null),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
    }, [onUpdate]);
    return null;
}

// ---- YOUR SUGGESTED LOCATIONS ----
const SUGGESTED_LOCATIONS = [
    { position: [38.76418558916113, 20.789713587619833], name: "Vathiavali Beach", description: "Calm waters, great for swimming, has road access and beach bar.", type: "Beach", difficulty: "Easy", duration: "2 hours" },
    { position: [38.75719808045438, 20.767915020459796], name: "Gerakas Beach", description: "Calm waters, no road access, more private.", type: "Beach", difficulty: "Easy", duration: "2 hours" },
    { position: [38.68784768039136, 20.74100958886832], name: "Scorpios Island", description: "Private island, access to one beach that can be crowded.", type: "Beach", difficulty: "Easy", duration: "30 Minutes" },
    { position: [38.6148442212325, 20.759276148506192], name: "Papanikolis Cave", description: "Sea cave—best in calm seas, Cant use anchor inside", type: "Cave", difficulty: "Hard", duration: "10 minutes"  },
    { position: [38.676316767313374, 20.72628328895621], name: "Lakka Beach", description: "Blue waters, not accessible by car.", type: "Beach", difficulty: "Easy", duration: "1 hour" },
    { position: [38.641453188521176, 20.734958763870505], name: "Agios Ioannis Lake", description: "Calm blue waters, great for swimming, has road access.", type: "Beach", difficulty: "Easy", duration: "1 hours" },
    { position: [38.665472594390145, 20.777818493575722], name: "Karnagio Restaurant", description: "Great lunch stop, beach next to it.", type: "Restaurant", difficulty: "Easy", duration: "2 hours" },
];

// emoji + color per supported type
const typeEmoji = (type) => {
    switch (type) {
        case 'Beach':      return { emoji: '🏖️', color: '#0ea5e9' };
        case 'Cave':       return { emoji: '🪨', color: '#6366f1' };
        case 'Restaurant': return { emoji: '🍽️', color: '#fff05a' };
        case 'Marina':     return { emoji: '⚓',  color: '#1e293b' };
        default:           return null;
    }
};

export default function BoatNavigation() {
    const [setMap] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userPos, setUserPos] = useState(null);
    const [outOfBounds, setOutOfBounds] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const deferredPromptRef = useRef(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);


    useEffect(() => {
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);

        const onBIP = (e) => {
            e.preventDefault();
            deferredPromptRef.current = e;
            setCanInstall(true);
        };
        const onInstalled = () => {
            setCanInstall(false);
            setIsStandalone(true);
            deferredPromptRef.current = null;
        };

        window.addEventListener('beforeinstallprompt', onBIP);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBIP);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        const promptEvent = deferredPromptRef.current;
        if (!promptEvent) return;
        promptEvent.prompt();
        await promptEvent.userChoice;
        deferredPromptRef.current = null;
        setCanInstall(false);
    };

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!userPos) return;
        setOutOfBounds(!pointInRect(userPos, ALLOWED_RECT));
    }, [userPos]);

    //  Stable heading based on GPS course
    const courseHeading = useCourseHeading(userPos, {
        minMoveMeters: 2,      // only update if you moved at least 2m
        minIntervalMs: 500,    // only update every 0.5s
        smoothAlpha: 0.7,      // lower smoothing, reacts faster
    });





    // bounds include allowed rect + suggested markers
    const maxBounds = useMemo(() => {
        const [sw, ne] = ALLOWED_RECT;
        const pts = [sw, ne, ...SUGGESTED_LOCATIONS.map(l => l.position)];
        const contentBounds = boundsFromPoints(pts);
        return padRectMeters(contentBounds, DRAG_PAD_METERS);
    }, []);

    const statusText = outOfBounds ? 'Outside Bounds' : 'Inside Bounds';
    const statusColor = outOfBounds ? '#ef4444' : '#10b981';

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#0b3b8c,#0891b2)', position: 'relative', overflow: 'hidden' }}>
            {/* header */}
            <div style={{ position: 'relative', zIndex: 20, background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #dbeafe', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#2563eb,#06b6d4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Anchor className="w-6 h-6" color="white" />
                        </div>

                        {/* Title + subtitle + Install button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>DiavlosNavigator</h1>
                                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Navigate • Explore • Discover</p>
                            </div>


                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                            <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: 9999, animation: 'pulse 2s infinite' }} />
                            GPS {userPos ? 'Active' : 'Searching…'}
                        </div>
                    </div>
                </div>
            </div>

            {/* map */}
            <div style={{ position: 'relative', height: 'calc(100vh - 80px)' }}>
                <MapContainer
                    center={MARINA_LOCATION}
                    zoom={13}
                    minZoom={11}
                    maxZoom={16}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                    whenCreated={setMap}
                    preferCanvas={true}
                    maxBounds={maxBounds}
                    maxBoundsViscosity={0.6}
                >
                    <TileLayer url="https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg" />

                    {/* geolocation watcher */}
                    <Geolocate onUpdate={setUserPos} />

                    {/* marina (25px) */}
                    <Marker position={MARINA_LOCATION} icon={createCustomIcon(typeEmoji('Marina').color, typeEmoji('Marina').emoji, 25)}>
                        <Tooltip permanent direction="bottom" offset={[0, 18]} opacity={1} className="map-label">
                            Diavlos Marine
                        </Tooltip>
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold text-slate-900 mb-1">Diavlos Marine</h3>
                                <p className="text-sm text-slate-600">Your starting point</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* allowed rectangle */}
                    <Rectangle bounds={ALLOWED_RECT} pathOptions={{ color: '#06b6d4', weight: 2, opacity: 0.8, fillOpacity: 0.12 }} />

                    {/* suggested locations (20px) */}
                    {SUGGESTED_LOCATIONS.filter(l => typeEmoji(l.type)).map((loc, idx) => {
                        const t = typeEmoji(loc.type);
                        return (
                            <Marker
                                key={idx}
                                position={loc.position}
                                icon={createCustomIcon(t.color, t.emoji, 20)}
                            >
                                <Tooltip
                                    permanent
                                    direction="bottom"
                                    offset={[0, 18]}
                                    opacity={1}
                                    className="map-label"
                                >
                                    {loc.name}
                                </Tooltip>
                                <Popup>
                                    <div className="p-2 text-sm">
                                        <div className="font-semibold">{loc.name}</div>
                                        <div className="text-slate-600">{loc.description}</div>

                                        {/* stacked info block */}
                                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div>
                                                <Badge variant="secondary">Type: {loc.type}</Badge>
                                            </div>
                                            <div>
                                                <Badge
                                                    variant="outline"
                                                    style={{
                                                        borderColor: getDifficultyColor(loc.difficulty),
                                                        color: getDifficultyColor(loc.difficulty)
                                                    }}
                                                >
                                                    Difficulty: {loc.difficulty}
                                                </Badge>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                Suggested stay: {loc.duration}
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}



                    {/* user position */}
                    {userPos && (
                        <>
                            {/* Stable heading cone (GPS course) */}
                                                        {courseHeading != null && (
                                                            <Polygon
                                                                positions={buildHeadingCone(userPos, courseHeading, 250, 75, 28)}
                                                                pathOptions={{
                                                                    fillColor: '#2563eb', // blue-600 for better contrast
                                                                    fillOpacity: 0.65,     // more opaque, less transparent
                                                                    weight: 0
                                                                }}
                                                            />
                                                        )}

                            <Marker position={userPos} icon={createCustomIcon(outOfBounds ? '#ef4444' : '#10b981', '🚤', 30)}>
                                <Tooltip permanent direction="bottom" offset={[0, 18]} opacity={1} className="map-label">
                                    You
                                </Tooltip>
                                <Popup>
                                    <div className="p-2 text-sm">
                                        <div className="font-semibold">You are here</div>
                                        {outOfBounds ? (
                                            <div style={{ color: '#ef4444', marginTop: 4 }}>Outside allowed area</div>
                                        ) : (
                                            <div style={{ color: '#10b981', marginTop: 4 }}>Inside allowed area</div>
                                        )}
                                        <div className="text-xs text-slate-600 mt-1">
                                            {(() => {
                                                const m = distanceToRectEdgeMeters(userPos, ALLOWED_RECT);
                                                return isFinite(m) ? `~${Math.round(m)} Meters to allowed area` : '';
                                            })()}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>

                            <Circle center={userPos} radius={25} pathOptions={{ color: outOfBounds ? '#ef4444' : '#10b981', weight: 1, fillOpacity: 0.15 }} />
                        </>
                    )}
                </MapContainer>

                {/* --- HUD overlay (single Info button/panel) --- */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0, left: 0,
                        zIndex: 10000,
                        pointerEvents: 'none',
                        background: 'transparent',
                    }}
                >


                    {/* INFO BUTTON (bottom-right) */}
                    <div style={{ position: 'absolute', right: 16, bottom: TOGGLE_BOTTOM, pointerEvents: 'auto' }}>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                            Start Navigating
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* INFO PANEL — opens ABOVE the button */}
                    {showInfo && (
                        <div
                            style={{
                                position: 'absolute',
                                right: 16,
                                bottom: TOGGLE_BOTTOM + PANEL_OFFSET,
                                minWidth: 300,
                                background: 'rgba(255, 255, 255, 0.5)',
                                backdropFilter: 'blur(14px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(14px) saturate(180%)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 16,
                                padding: 16,
                                pointerEvents: 'auto',
                                boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                                zIndex: 10001,
                            }}
                        >
                            {/* ✖ close */}
                            <button
                                aria-label="Close info"
                                onClick={() => setShowInfo(false)}
                                title="Close"
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    color: '#0f172a'
                                }}
                            >
                                ✖
                            </button>

                            <h3
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    margin: 0,
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    color: '#0f172a'
                                }}
                            >
                                <Navigation className="w-4 h-4" color="#059669" />
                                Info
                            </h3>

                            <div style={{ marginTop: 8, fontSize: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Current status</span>
                                    <span style={{ fontWeight: 700, color: statusColor }}>{statusText}</span>
                                </div>

                                <div style={{ marginTop: 8, fontWeight: 600 }}>Legend</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div><span>⚓</span> ➡️ Diavlos Marine</div>
                                    <div><span>🏖️</span> ➡️ Beach</div>
                                    <div><span>🍽️</span> ➡️ Restaurant</div>
                                    <div><span>🪨</span> ➡️ Cave</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .leaflet-popup-tip { background: white; }
        .custom-marker { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
        @keyframes pulse { 0%{opacity:1} 50%{opacity:.5} 100%{opacity:1} }

        /* Smaller label bubble + font */
        .leaflet-tooltip.map-label {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #0f172a;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 10px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          padding: 4px 6px;
          font-size: 10px;
          font-weight: 500;
          line-height: 1.1;
          margin: 0 !important;
        }
        .leaflet-tooltip.map-label::before { display: none; }

        /* base: no default bg/border */
        .leaflet-div-icon.custom-marker {
          background: transparent;
          border: none;
        }

        /* the pin fills the icon box; size comes from iconSize */
        .leaflet-div-icon.custom-marker .pin {
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          border: 2px solid #fff;
        }

        .leaflet-div-icon.custom-marker .glyph {
          transform: rotate(45deg);
          color: #fff;
          font-size: 45%;
          line-height: 1;
        }
      `}</style>
        </div>
    );
}

