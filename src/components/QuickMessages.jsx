export default function QuickMessages({ onMessageSelect }) {
    const quickMessages = [
        {
            title: 'Weather Alert',
            message: 'Thunderstorm approaching. Return to shore immediately.',
            type: 'weather',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
        },
        {
            title: 'Rental Reminder',
            message: 'Your rental period ends in 30 minutes. Please return.',
            type: 'info',
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200',
        },
        {
            title: 'Hazard Warning',
            message: 'Shallow waters ahead. Navigate carefully.',
            type: 'warning',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
        },
        {
            title: 'Emergency Notice',
            message: 'Immediate evacuation required. Proceed to nearest safe area.',
            type: 'emergency',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
        },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Messages</h3>
            <div className="space-y-2">
                {quickMessages.map((msg, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onMessageSelect(msg.title, msg.message, msg.type)}
                        className={`w-full ${msg.bgColor} ${msg.borderColor} border rounded-lg p-4 text-left hover:shadow-md transition-shadow`}
                    >
                        <div className="font-semibold text-slate-900">{msg.title}</div>
                        <div className="text-sm text-slate-600 truncate">{msg.message}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}