import { Clock } from 'lucide-react';

export default function NotificationHistory({ notifications }) {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            </div>

            <div className="p-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No notifications sent yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                        {notification.title}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getPriorityColor(notification.priority)}`}>
                    {notification.priority}
                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="capitalize">{notification.type}</span>
                                    <span>{formatTime(notification.created_at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
