import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Bell, Users, Anchor } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NotificationForm from './NotificationForm.jsx';
import NotificationHistory from './NotificationHistory.jsx';
import QuickMessages from '/components/QuickMessages.jsx';
import LiveMap from './LiveMap';

export default function AdminPanel() {
    const [activeUsers, setActiveUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('tracking');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [draftMessage, setDraftMessage] = useState({ title: '', message: '', type: 'info' });

    // Fetch users
    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('active_users')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setActiveUsers(data || []);
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setNotifications(data || []);
    };

    useEffect(() => {
        fetchUsers();
        fetchNotifications();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchUsers(), fetchNotifications()]);
        setIsRefreshing(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-[1800px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Anchor className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-slate-800">Navigator Admin</h1>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="font-medium">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </header>

            <div className="max-w-[1800px] mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Users" icon={<Users />} value={activeUsers.length} />
                    <StatCard title="Active" icon={<Activity />} value={activeUsers.filter(u => u.status === 'active').length} color="green" />
                    <StatCard title="Emergencies" icon={<Bell />} value={activeUsers.filter(u => u.status === 'emergency').length} color="red" />
                    <StatCard title="Notifications" icon={<Bell />} value={notifications.length} />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('tracking')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === 'tracking'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Activity className="w-5 h-5" /> Live Tracking
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === 'notifications'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Bell className="w-5 h-5" /> Notifications
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Map or Form */}
                    <div className="lg:col-span-2">
                        {activeTab === 'tracking' ? (
                            <LiveMap users={activeUsers} />
                        ) : (
                            <NotificationForm
                                users={activeUsers}
                                onNotificationSent={fetchNotifications}
                                draft={draftMessage}
                            />
                        )}
                    </div>

                    {/* Right: Quick Messages + History */}
                    <div className="space-y-6">
                        <QuickMessages
                            onMessageSelect={(title, message, type) => {
                                setDraftMessage({ title, message, type });
                                setActiveTab('notifications');
                            }}
                        />
                        <NotificationHistory notifications={notifications} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, icon, value, color }) {
    const colorClasses = {
        green: 'from-green-50 to-emerald-50 border-green-200 text-green-700',
        red: 'from-red-50 to-rose-50 border-red-200 text-red-700',
        default: 'from-slate-50 to-white border-slate-200 text-slate-700',
    };
    const style = colorClasses[color] || colorClasses.default;
    return (
        <div className={`bg-gradient-to-br ${style} rounded-2xl p-6 border-2`}>
            <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 text-blue-600">{icon}</div>
                <span className="text-sm font-medium text-slate-500">{title}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </div>
    );
}