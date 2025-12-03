import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import BoatNavigation from './BoatNavigation';
import './index.css';
import AdminPanel from "./components/AdminPanel";
import Layout from "./Layout";
import ScrollToTop from "./components/ScrollToTop";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                {/* Pages WITH navbar */}
                <Route element={<Layout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/navigator" element={<BoatNavigation />} />
                </Route>

                {/* Pages WITHOUT navbar */}
                <Route path="/papagalos22" element={<AdminPanel />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);