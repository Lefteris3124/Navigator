import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send } from 'lucide-react';

export default function NotificationForm({ users, onNotificationSent, draft }) {
    const [type, setType] = useState('info');
    const [priority, setPriority] = useState('medium');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (draft?.title) setTitle(draft.title);
        if (draft?.message) setMessage(draft.message);
        if (draft?.type) setType(draft.type);
    }, [draft]);

    const handleSendNotification = async () => {
        if (!title || !message) return;
        setIsSending(true);

        try {
            // ✅ 1️⃣ Save notification to Supabase (for history)
            const { error: insertError } = await supabase.from('notifications').insert([
                {
                    title,
                    message,
                    type,
                    priority,
                    sent_by: 'Admin',
                },
            ]);

            if (insertError) throw insertError;

            // ✅ 2️⃣ Trigger the Supabase Edge Function to push it to all subscribers
            const response = await fetch(
                `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/send-notification`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                        title,
                        message,
                    }),
                }
            );

            if (!response.ok) {
                console.error("❌ Failed to trigger send-notification function:", await response.text());
            } else {
                console.log("✅ Push notification sent successfully!");
            }

            // ✅ 3️⃣ Notify parent and reset form
            if (onNotificationSent) onNotificationSent();
            setTitle('');
            setMessage('');
        } catch (err) {
            console.error("❌ Error sending notification:", err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Send Notification</h3>

            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <textarea
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500"
            />

            <button
                onClick={handleSendNotification}
                disabled={isSending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
                {isSending ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" /> Send
                    </>
                )}
            </button>
        </div>
    );
}