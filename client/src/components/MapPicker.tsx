"use client";

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Navigation } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Fix default marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    value?: { lat: number; lng: number };
    onChange: (coords: { lat: number; lng: number }) => void;
    placeholder?: string;
}

function LocationMarker({ position, setPosition, onChange }: { position: [number, number], setPosition: (p: [number, number]) => void, onChange: (c: { lat: number, lng: number }) => void }) {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onChange({ lat, lng });
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={customIcon} />
    );
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
    const [position, setPosition] = useState<[number, number]>(
        value?.lat && value?.lng ? [value.lat, value.lng] : [30.0444, 31.2357] // Cairo default
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery) return;

        setSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
                setPosition(newPos);
                onChange({ lat: newPos[0], lng: newPos[1] });
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    }, [searchQuery, onChange]);

    const handleCurrentLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setPosition(newPos);
                onChange({ lat: newPos[0], lng: newPos[1] });
            });
        }
    }, [onChange]);

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="ابحث عن منطقتك..."
                        className="pr-10 text-right"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button variant="outline" type="button" onClick={() => handleSearch()} disabled={searching}>
                    بحث
                </Button>
                <Button variant="outline" type="button" size="icon" onClick={handleCurrentLocation} title="موقعي الحالي">
                    <Navigation className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} onChange={onChange} />
                    <ChangeView center={position} />
                </MapContainer>
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 shadow-sm border border-gray-100">
                    اضغط على الخريطة لتحديد الموقع بدقة
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100 italic">
                <MapPin className="h-3 w-3 text-red-500" />
                <span>الإحداثيات الحالية: {position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
            </div>
        </div>
    );
}
