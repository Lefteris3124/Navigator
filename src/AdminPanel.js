import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Users, Bell, Activity, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';
import UserMap from "./components/QuickMessages";
import NotificationPanel from "./components/NotificationPanel";

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('map');

    // Fetch users and their latest locations
    const fetchUsers = async () => {
        try {
            const { data: usersData, error: usersError } = await supabase
                .from('active_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            if (usersData) {
                const usersWithLocations = await Promise.all(
                    usersData.map(async (user) => {
                        const { data: locationData } = await supabase
                            .from('user_locations')
                            .select('*')
                            .eq('user_id', user.id)
                            .order('timestamp', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        return {
                            ...user,
                            latest_location: locationData || undefined,
                        };
                    })
                );

                setUsers(usersWithLocations);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Fetch recent notifications
    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data) setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Send notification
    const handleSendNotification = async (notification) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([notification]);

            if (error) throw error;

            await fetchNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchUsers(), fetchNotifications()]);
            setLoading(false);
        };

        loadData();

        const usersChannel = supabase
            .channel('active_users_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_users' }, fetchUsers)
            .subscribe();

        const locationsChannel = supabase
            .channel('user_locations_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, fetchUsers)
            .subscribe();

        const notificationsChannel = supabase
            .channel('notifications_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
            .subscribe();

        return () => {
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(locationsChannel);
            supabase.removeChannel(notificationsChannel);
        };
    }, []);

    const activeUsers = users.filter(u => u.status === 'active');
    const emergencyUsers = users.filter(u => u.status === 'emergency');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">Navigator Admin</h1>
                </div>
            </header>

            <div className="max-w-[1800px] mx-auto px-6 py-8">
                {/* Add a test so you can see if they render */}
                <UserMap users={users} onUserSelect={setSelectedUser} selectedUserId={selectedUser?.id} />

                <div className="mt-10">
                    <NotificationPanel
                        users={users}
                        selectedUser={selectedUser}
                        onSendNotification={handleSendNotification}
                        recentNotifications={notifications}
                    />
                </div>
            </div>
        </div>
    );
}