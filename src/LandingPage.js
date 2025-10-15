import {Anchor, ChevronRight, MapPin, Navigation, Shield, Star, Waves} from 'lucide-react';
import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from "react-router-dom";



function LandingPage() {

    const deferredPromptRef = useRef(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);

        const onBIP = (e) => {
            e.preventDefault();
            deferredPromptRef.current = e;
            console.log("✅ beforeinstallprompt fired");
            setCanInstall(true);
        };

        window.addEventListener("beforeinstallprompt", onBIP);

        // Detect Opera and Safari
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const isOpera = /Opera|OPR\//.test(ua);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

        if (isOpera || isSafari) {
            console.log("ℹ️ Detected Opera or Safari — enabling manual install fallback");
            setCanInstall(true);
        }

        window.addEventListener("appinstalled", () => {
            console.log("🎉 App installed!");
            setCanInstall(false);
            setIsStandalone(true);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", onBIP);
        };
    }, []);

    const handleInstallClick = async () => {
        const promptEvent = deferredPromptRef.current;

        if (promptEvent) {
            promptEvent.prompt();
            await promptEvent.userChoice;
            deferredPromptRef.current = null;
            setCanInstall(false);
        } else {
            //  Manual fallback for Opera / Safari
            alert("To install the app, open the browser menu and select 'Add to Home screen'.");
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 transition-all duration-300">
                <nav className="container mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between text-center sm:text-left">

                    {/* Logo centered on mobile, left on desktop */}
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Anchor className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                        <span className="text-xl sm:text-2xl font-bold text-slate-800">
        Diavlos Navigator
      </span>
                    </div>

                    {/* Buttons section */}
                    <div
                        className="
        grid grid-cols-2 gap-35 justify-items-center
        sm:flex sm:justify-end sm:gap-6
      "
                    >
                        <a href="#features" className="cssbuttons-2">
  <span>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
    Features
  </span>
                        </a>

                        <a href="#how-it-works" className="cssbuttons-io-button text-sm sm:text-base">
                            Get Started
                            <span className="icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
                        </a>
                    </div>
                </nav>
            </header>

            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* 🎥 background video */}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoadedData={(e) => e.target.play().catch(() => {})}
                >
                    <source src="/NavigatorVid.mp4" type="video/mp4" />
                </video>


                {/* 🌫 overlay for readability */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>


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
                                <button
                                    onClick={() => navigate("/navigator")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    Start Navigating
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {canInstall && !isStandalone && (
                                    <button
                                        onClick={handleInstallClick}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                                    >
                                        📱 Install App
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-8 pt-4 text-white">
                                <div>
                                    <div className="text-3xl font-bold">Hundreds Of</div>
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
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Download The Application</h3>
                            <p className="text-slate-600 mb-4">
                                Download the app from the download button at the top of the page.
                            </p>

                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Open the App</h3>
                            <p className="text-slate-600">
                                Launch Diavlos Navigator on your device.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Start Exploring</h3>
                            <p className="text-slate-600">
                                Press The Navigate Button at the bottom right of the screen to start exploring.
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
            <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-cyan-500">
                <div className="container mx-auto max-w-4xl">
                    <div className="rounded-3xl p-12 md:p-16 text-center shadow-2xl relative overflow-hidden bg-white/10 backdrop-blur-md">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Socials
                            </h2>

                            <div className="flex justify-center mt-6">
                                <SocialsCard />
                            </div>
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

function SocialsCard() {
    return (
        <div className="card" style={{ marginTop: "2rem" }}>
            {/* Instagram */}
            <a
                className="socialContainer containerOne"
                href="instagram://user?username=diavlosmarine"
                target="_blank"
                rel="noopener noreferrer"
            >
                <svg viewBox="0 0 16 16" className="socialSvg instagramSvg">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"></path>
                </svg>
            </a>

            {/* Twitter
            <a
                className="socialContainer containerTwo"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
            >
                <svg viewBox="0 0 16 16" className="socialSvg twitterSvg">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"></path>
                </svg>
            </a>
            */}

            {/* Facebook */}
            <a
                className="socialContainer containerThree"
                href="https://www.facebook.com/share/1EM2EXsgfN/"
                target="_blank"
                rel="noopener noreferrer"
            >
                <svg viewBox="0 0 320 512" className="socialSvg facebookSvg">
                    <path d="M279.14 288l14.22-92.66h-88.91V127.56c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0C141.09 0 89.09 54.42 89.09 153.16v42.18H0V288h89.09v224h107.23V288z" />
                </svg>
            </a>

            {/* WhatsApp */}
            <a
                className="socialContainer containerFour"
                href="https://wa.me/306987769097"
                target="_blank"
                rel="noopener noreferrer"
            >
                <svg viewBox="0 0 16 16" className="socialSvg whatsappSvg">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path>
                </svg>
            </a>
        </div>
    );
}

export default LandingPage;
