import { useEffect, useMemo, useState } from 'react';
import {
  getNotifications,
  markNotificationsRead,
} from '../api/notifications.js';

const formatNotificationTime = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = async () => {
    try {
      setError('');
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (notificationError) {
      setError(notificationError.message);
    }
  };

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 15000);

    const handleWindowFocus = () => {
      loadNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleToggle = async () => {
    const nextOpenState = !isOpen;
    if (nextOpenState) {
      await loadNotifications();
    }

    setIsOpen(nextOpenState);

    if (!nextOpenState || unreadCount === 0) {
      return;
    }

    try {
      await markNotificationsRead();
      await loadNotifications();
    } catch (notificationError) {
      setError(notificationError.message);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        onClick={handleToggle}
        type="button"
      >
        Notifications
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-emerald-400 px-1.5 py-0.5 text-xs font-bold text-slate-950">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-200/60 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/30">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900"
                  key={notification._id}
                >
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
