import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        fetchNotifications();

        const channel = supabase
            .channel('user_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification_receipts',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            const { data: receipts, error: receiptsError } = await supabase
                .from('notification_receipts')
                .select('notification_id, read_at')
                .eq('user_id', userId)
                .order('delivered_at', { ascending: false })
                .limit(20);

            if (receiptsError) throw receiptsError;

            if (!receipts || receipts.length === 0) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            const notificationIds = receipts.map(r => r.notification_id);

            const { data: notificationsData, error: notificationsError } = await supabase
                .from('notifications')
                .select('*')
                .in('id', notificationIds);

            if (notificationsError) throw notificationsError;

            const notificationsWithReadStatus = notificationsData.map(notif => {
                const receipt = receipts.find(r => r.notification_id === notif.id);
                return {
                    ...notif,
                    isRead: !!receipt?.read_at,
                };
            });

            setNotifications(notificationsWithReadStatus);
            setUnreadCount(notificationsWithReadStatus.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notification_receipts')
                .update({ read_at: new Date().toISOString() })
                .eq('notification_id', notificationId)
                .eq('user_id', userId);

            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications: fetchNotifications,
    };
}
