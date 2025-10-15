import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLocationTracking() {
    const [sessionId, setSessionId] = useState('');
    const [userId, setUserId] = useState('');
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);

    useEffect(() => {
        const storedSessionId = localStorage.getItem('session_id') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('session_id', storedSessionId);
        setSessionId(storedSessionId);

        initializeSession(storedSessionId);

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const initializeSession = async (sessionId) => {
        try {
            const { data: existingUser } = await supabase
                .from('active_users')
                .select('id')
                .eq('session_id', sessionId)
                .maybeSingle();

            if (existingUser) {
                setUserId(existingUser.id);
                await supabase
                    .from('active_users')
                    .update({ last_seen: new Date().toISOString(), status: 'active' })
                    .eq('id', existingUser.id);
            } else {
                const { data: newUser, error } = await supabase
                    .from('active_users')
                    .insert({ session_id: sessionId, status: 'active' })
                    .select()
                    .single();

                if (error) throw error;
                setUserId(newUser.id);
            }

            startTracking();
        } catch (error) {
            console.error('Error initializing session:', error);
        }
    };

    const startTracking = () => {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            return;
        }

        setIsTracking(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    await supabase
                        .from('active_users')
                        .update({
                            latitude,
                            longitude,
                            last_seen: new Date().toISOString(),
                            status: 'active',
                        })
                        .eq('session_id', sessionId);
                } catch (error) {
                    console.error('Error updating location:', error);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                updateHeartbeat();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }
        );

        const heartbeatInterval = setInterval(() => {
            updateHeartbeat();
        }, 30000);

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            clearInterval(heartbeatInterval);
        };
    };

    const updateHeartbeat = async () => {
        try {
            await supabase
                .from('active_users')
                .update({ last_seen: new Date().toISOString() })
                .eq('session_id', sessionId);
        } catch (error) {
            console.error('Error updating heartbeat:', error);
        }
    };

    const setEmergencyStatus = async () => {
        try {
            await supabase
                .from('active_users')
                .update({ status: 'emergency', last_seen: new Date().toISOString() })
                .eq('session_id', sessionId);
        } catch (error) {
            console.error('Error setting emergency status:', error);
        }
    };

    return {
        sessionId,
        userId,
        isTracking,
        setEmergencyStatus,
    };
}
