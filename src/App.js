import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Circle } from 'react-leaflet';
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Anchor, MapPin, Navigation, Waves, Clock } from 'lucide-react';
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
const CENTER = [38.719482, 20.755199];

// 👉 Size of the allowed rectangle (editable)
const halfWidthMeters = 4500;   // left/right from center
const halfHeightMeters = 8000;  // up/down from center

// Map will start here too (your marina)
const MARINA_LOCATION = [38.78885339128394, 20.72151825153614];

// ---------------- helpers ----------------
const createCustomIcon = (color, icon) => L.divIcon({
  html: `
    <div style="
      background:${color};width:40px;height:40px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.15);border:3px solid white;">
      <div style="transform:rotate(45deg);color:white;font-size:16px;">${icon}</div>
    </div>`,
  className: 'custom-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const getTypeIcon = (type) => ({ 'Historic Site':'🏛️', Beach:'🏖️', Sandbar:'🏝️', Marina:'⚓' }[type] || '📍');
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

// ---- NEW: padded drag bounds (in meters) ----
const DRAG_PAD_METERS = 4000;

function padRectMeters([[swLat, swLng], [neLat, neLng]], padM) {
  const midLat = (swLat + neLat) / 2;
  const dLat = padM / metersPerDegLat;
  const dLng = padM / metersPerDegLng(midLat);
  return [
    [swLat - dLat, swLng - dLng],
    [neLat + dLat, neLng + dLng],
  ];
}

// haversine (unused here but kept for reference)
const distMeters = ([lat1, lon1], [lat2, lon2]) => {
  const R = 6371000, toRad = (d)=>d*Math.PI/180;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
};

function FollowMe({ follow, setFollow, userPos, map }) {
  useEffect(() => {
    if (!map || !follow || !userPos) return;
    const z = typeof map.getZoom === 'function' ? map.getZoom() : 14;
    map.setView(userPos, Math.max(z, 14), { animate: true });
  }, [follow, userPos, map]);

  return (
      <Button
          onClick={() => {
            setFollow((f) => !f);
            if (!follow && userPos && map) map.setView(userPos, 15);
          }}
          className={`bg-white/90 border text-slate-900 shadow-lg ${follow ? 'ring-2' : ''}`}
          size="sm"
      >
        <Navigation className="w-4 h-4" />&nbsp;{follow ? 'Following' : 'Follow Me'}
      </Button>
  );
}

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

const SUGGESTED_LOCATIONS = [
  { position: [38.729, 20.761], name: "Blue Cove", description: "Calm waters, great for swimming", type: "Beach", difficulty: "Easy", duration: "2-3 hours" },
  { position: [38.722, 20.748], name: "Fisherman Point", description: "Scenic spot, good for a quick stop", type: "Historic Site", difficulty: "Easy", duration: "1-2 hours" },
];

export default function BoatNavigation() {
  const [map, setMap] = useState(null);
  const [showRect, setShowRect] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPos, setUserPos] = useState(null);
  const [follow, setFollow] = useState(false);
  const [outOfBounds, setOutOfBounds] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!userPos) return;
    setOutOfBounds(!pointInRect(userPos, ALLOWED_RECT));
  }, [userPos]);

  // ---- NEW: limit panning to a padded box around the allowed rectangle ----
  const maxBounds = useMemo(() => padRectMeters(ALLOWED_RECT, DRAG_PAD_METERS), []);

  return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#0b3b8c,#0891b2)', position: 'relative' }}>
        {/* header */}
        <div style={{ position: 'relative', zIndex: 20, background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #dbeafe', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#2563eb,#06b6d4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Anchor className="w-6 h-6" color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>AquaGuide</h1>
                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Navigate • Explore • Discover</p>
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
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
              whenCreated={setMap}
              preferCanvas={true}
              maxBounds={maxBounds}
              maxBoundsViscosity={1.0}   // ← sticky bounds; can't drag past padding
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* geolocation watcher */}
            <Geolocate onUpdate={setUserPos} />

            {/* marina */}
            <Marker position={MARINA_LOCATION} icon={createCustomIcon('#1e293b', '🏢')}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-slate-900 mb-1">Marina Headquarters</h3>
                  <p className="text-sm text-slate-600">Your starting point</p>
                </div>
              </Popup>
            </Marker>

            {/* allowed rectangle */}
            {showRect && (
                <Rectangle
                    bounds={ALLOWED_RECT}
                    pathOptions={{ color: '#06b6d4', weight: 2, opacity: 0.8, fillOpacity: 0.12 }}
                />
            )}

            {/* user position */}
            {userPos && (
                <>
                  <Marker position={userPos} icon={createCustomIcon(outOfBounds ? '#ef4444' : '#10b981', '🧭')}>
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
                            return isFinite(m) ? `~${Math.round(m)} m to boundary` : '';
                          })()}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle center={userPos} radius={25} pathOptions={{ color: outOfBounds ? '#ef4444' : '#10b981', weight: 1, fillOpacity: 0.15 }} />
                </>
            )}
          </MapContainer>

          {/* controls */}
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1000, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Button onClick={() => setShowRect(s => !s)} className="bg-white/90 border text-slate-900 shadow-lg" size="sm">
              <Waves className="w-4 h-4" />&nbsp;{showRect ? 'Hide Area' : 'Show Area'}
            </Button>
            {map && <FollowMe follow={follow} setFollow={setFollow} userPos={userPos} map={map} />}
          </div>

          {/* legend */}
          <Card className="absolute bottom-4 left-4 bg-white/95 border-0 shadow-xl" style={{ position: 'absolute', bottom: 16, left: 16 }}>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin className="w-4 h-4" color="#2563eb" />
                Map Legend
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-slate-800 rounded-full" />
                  <span className="text-slate-700">Marina HQ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4" style={{ border: '2px solid #06b6d4', background: 'rgba(6,182,212,0.2)', borderRadius: 2 }} />
                  <span className="text-slate-700">Allowed Area</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* status */}
          <Card className="absolute bottom-4 right-4 bg-white/95 border-0 shadow-xl" style={{ position: 'absolute', bottom: 16, right: 16 }}>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation className="w-4 h-4" color="#059669" />
                Quick Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Allowed width</span>
                  <span className="font-medium text-slate-900">{(halfWidthMeters*2/1000).toFixed(1)} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Allowed height</span>
                  <span className="font-medium text-slate-900">{(halfHeightMeters*2/1000).toFixed(1)} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Drag padding</span>
                  <span className="font-medium text-slate-900">{(DRAG_PAD_METERS/1000).toFixed(1)} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status</span>
                  <span style={{ fontWeight: 600, color: outOfBounds ? '#ef4444' : '#10b981' }}>
                  {outOfBounds ? 'Outside Allowed Area' : 'All Good ☀️'}
                </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <style>{`
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .leaflet-popup-tip { background: white; }
        .custom-marker { filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
        @keyframes pulse { 0%{opacity:1} 50%{opacity:.5} 100%{opacity:1} }
      `}</style>
      </div>
  );
}