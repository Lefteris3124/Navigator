import React, { useState, useEffect } from 'react';
import {
    X, Star, MapPin, Phone, Clock, Globe, Navigation,
    ChevronLeft, ChevronRight
} from 'lucide-react';

export default function PlaceInfoWindow({ place, isOpen, onClose, onDirections }) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Reset photo slider when new place opens
    useEffect(() => {
        setCurrentPhotoIndex(0);
    }, [place]);

    if (!isOpen || !place) return null;

    const nextPhoto = () => {
        setCurrentPhotoIndex(prev =>
            prev === place.photos.length - 1 ? 0 : prev + 1
        );
    };

    const prevPhoto = () => {
        setCurrentPhotoIndex(prev =>
            prev === 0 ? place.photos.length - 1 : prev - 1
        );
    };

    return (
        <div className="
    fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center sm:justify-center z-50 p-0 sm:p-4
    translate-y-[-70px] sm:translate-y-0
">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">

                {/* Photo Gallery */}
                <div className="relative h-56 bg-gray-200">
                    <img
                        src={place.photos[currentPhotoIndex]}
                        alt={place.name}
                        className="w-full h-full object-cover"
                    />

                    {/* Navigation Arrows */}
                    {place.photos.length > 1 && (
                        <>
                            <button
                                onClick={prevPhoto}
                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-colors"
                                aria-label="Previous photo"
                            >
                                <ChevronLeft className="w-6 h-6 text-white" />
                            </button>

                            <button
                                onClick={nextPhoto}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-colors"
                                aria-label="Next photo"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </>
                    )}

                    {/* Photo Navigation Dots */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                        {place.photos.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPhotoIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx === currentPhotoIndex ? 'bg-white w-6' : 'bg-white/60'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-lg"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto max-h-[calc(90vh-14rem)]">
                    {/* Header */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 pr-2">{place.name}</h2>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {place.category}
                            </span>

                            {place.priceLevel && (
                                <span className="text-gray-500 text-sm">{place.priceLevel}</span>
                            )}
                        </div>

                        {/* Rating */}
                        {place.rating && (
                            <div className="flex items-center gap-2 mt-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-gray-900">{place.rating}</span>
                                <span className="text-gray-500 text-sm">
                                    ({place.reviewCount?.toLocaleString()} reviews)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {place.description}
                    </p>

                    {/* Info Items */}
                    <div className="space-y-3">
                        {place.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-gray-700 text-sm">{place.address}</p>
                                    {place.distance && (
                                        <p className="text-blue-600 text-sm font-medium">
                                            {place.distance}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {place.hours && (
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <p className="text-gray-700 text-sm">{place.hours}</p>
                            </div>
                        )}

                        {place.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <a href={`tel:${place.phone}`} className="text-blue-600 text-sm hover:underline">
                                    {place.phone}
                                </a>
                            </div>
                        )}

                        {place.website && (
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <a
                                    href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-sm hover:underline"
                                >
                                    {place.website}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {/*<div className="flex gap-3 mt-6">
                        <button
                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            onClick={onDirections}
                        >
                            <Navigation className="w-5 h-5" />
                            Directions
                        </button>

                        <button className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                            Save
                        </button>
                    </div>*/}
                </div>
            </div>
        </div>
    );
}
