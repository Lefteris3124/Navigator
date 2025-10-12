import { Anchor, Navigation, Waves, MapPin, Clock, Shield, ChevronRight, Star } from 'lucide-react';
import React from 'react';

function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 transition-all duration-300">
                <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Anchor className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-slate-800">Diavlos Navigator</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Features</a>
                        <a
                            href="#how-it-works"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
                        >
                            Get Started
                        </a>
                    </div>
                </nav>
            </header>

            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* 🎥 background video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/NavigatorVid.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* 🌫️ overlay for readability */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

                {/* ✨ content (your original section stays here) */}
                <div className="relative z-10 container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                                <Waves className="w-4 h-4" />
                                <span>Navigate with Confidence</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                                Your Trusted Guide on the Water
                            </h1>
                            <p className="text-xl text-blue-50 leading-relaxed">
                                Experience seamless navigation with our easy-to-use app. Perfect for first-time boaters and seasoned sailors alike. Navigate safely to hidden coves, popular spots, and back to shore.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2">
                                    Start Navigating
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-8 pt-4 text-white">
                                <div>
                                    <div className="text-3xl font-bold">2,500+</div>
                                    <div className="opacity-80">Happy Boaters</div>
                                </div>
                                <div className="w-px h-12 bg-white/50"></div>
                                <div>
                                    <div className="text-3xl font-bold">4.9/5</div>
                                    <div className="flex items-center gap-1 opacity-80">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        Rating
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Everything You Need on the Water
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Simple, powerful features designed for safe and enjoyable boating experiences
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="group bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200">
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Navigation className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Real-Time Navigation</h3>
                            <p className="text-slate-600 leading-relaxed">
                                GPS-powered navigation with real-time updates. Never lose your way with our intuitive mapping system.
                            </p>
                        </div>
                        <div className="group bg-gradient-to-br from-slate-50 to-cyan-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200">
                            <div className="w-14 h-14 bg-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <MapPin className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Popular Spots</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Discover curated destinations including beaches, coves, and points of interest along your route.
                            </p>
                        </div>
                        <div className="group bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-200">
                            <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Safety First</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Weather alerts, hazard warnings, and emergency assistance at your fingertips for peace of mind.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            Simple Steps to Start
                        </h2>
                        <p className="text-xl text-slate-600">
                            Get on the water in minutes
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Rent Your Boat</h3>
                            <p className="text-slate-600">
                                Choose your boat and receive your Navigator app access code at checkout
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Open the App</h3>
                            <p className="text-slate-600">
                                Launch Navigator on your phone and enter your access code to get started
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Start Exploring</h3>
                            <p className="text-slate-600">
                                Navigate confidently to any destination with turn-by-turn guidance
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20 px-6 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                            What Boaters Say
                        </h2>
                        <p className="text-xl text-slate-600">
                            Trusted by thousands of happy customers
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "As a first-time boater, Navigator made me feel confident and safe. The interface is so intuitive!"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full"></div>
                                <div>
                                    <div className="font-semibold text-slate-900">Sarah M.</div>
                                    <div className="text-sm text-slate-600">Family Vacation</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "Found amazing hidden spots I would never have discovered on my own. This app is a game changer!"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full"></div>
                                <div>
                                    <div className="font-semibold text-slate-900">James R.</div>
                                    <div className="text-sm text-slate-600">Weekend Explorer</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "The safety features give me peace of mind. Weather alerts saved our trip once. Highly recommend!"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full"></div>
                                <div>
                                    <div className="font-semibold text-slate-900">Emily T.</div>
                                    <div className="text-sm text-slate-600">Adventure Seeker</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to Set Sail?
                            </h2>
                            <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
                                Join thousands of boaters who trust Navigator for their water adventures. Your next journey starts here.
                            </p>
                            <button className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 inline-flex items-center gap-2">
                                Get Started Today
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-12 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Anchor className="w-7 h-7 text-blue-400" />
                            <span className="text-xl font-bold text-white">Diavlos Navigator</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                        <div className="text-sm">
                            © 2025 Diavlos Navigator. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
