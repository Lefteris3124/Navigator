import { MapPin, Navigation, AlertCircle } from 'lucide-react';

export default function LiveMap({ users }) {
    const activeUsers = users.filter(u => u.status === 'active');
    const emergencyUsers = users.filter(u => u.status === 'emergency');
    const inactiveUsers = users.filter(u => u.status === 'inactive');

    const centerLat = users.length > 0
        ? users.reduce((sum, u) => sum + (u.latitude || 0), 0) / users.length
        : 0;
    const centerLng = users.length > 0
        ? users.reduce((sum, u) => sum + (u.longitude || 0), 0) / users.length
        : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Live Tracking</h2>
                </div>
                <div className="flex items-center gap-1 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">{activeUsers.length} Active</span>
                </div>
            </div>

            <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 aspect-[16/10]">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, #3b82f6 0px, #3b82f6 1px, transparent 1px, transparent 20px),
                           repeating-linear-gradient(90deg, #3b82f6 0px, #3b82f6 1px, transparent 1px, transparent 20px)`
                }}></div>

                {users.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <MapPin className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">No active users</p>
                        <p className="text-sm">Users will appear here when they share their location</p>
                    </div>
                ) : (
                    <div className="absolute inset-0 p-8">
                        {users.map((user, index) => {
                            const x = user.longitude !== null
                                ? ((user.longitude - (centerLng - 0.05)) / 0.1) * 100
                                : 50 + (Math.random() - 0.5) * 40;
                            const y = user.latitude !== null
                                ? ((centerLat + 0.05 - user.latitude) / 0.1) * 100
                                : 50 + (Math.random() - 0.5) * 40;

                            const clampedX = Math.max(5, Math.min(95, x));
                            const clampedY = Math.max(5, Math.min(95, y));

                            let color = 'bg-green-500';
                            let Icon = MapPin;
                            if (user.status === 'emergency') {
                                color = 'bg-red-500';
                                Icon = AlertCircle;
                            } else if (user.status === 'inactive') {
                                color = 'bg-gray-400';
                            }

                            return (
                                <div
                                    key={user.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                                    style={{ left: `${clampedX}%`, top: `${clampedY}%` }}
                                >
                                    <div className={`${color} rounded-full p-2 shadow-lg border-2 border-white animate-pulse`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        User {index + 1}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-700">Emergency</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700">Inactive</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
