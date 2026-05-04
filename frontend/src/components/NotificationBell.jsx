import { useEffect, useMemo, useState } from 'react';
import {
  getNotifications,
  markNotificationsRead,
} from '../api/notifications.js';

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
      const data = await getNotifications();
      setNotifications(data.notifications);
    } catch (notificationError) {
      setError(notificationError.message);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleToggle = async () => {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);

    if (nextOpenState && unreadCount > 0) {
      try {
        await markNotificationsRead();
        await loadNotifications();
      } catch (notificationError) {
        setError(notificationError.message);
      }
    }
  };

  return (
    <div className="relative">
      <button
        className="relative rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        onClick={handleToggle}
        type="button"
      >
        Bell
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-emerald-400 px-1.5 py-0.5 text-xs font-bold text-slate-950">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-white/10 bg-slate-950 p-4 shadow-xl shadow-black/30">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div className="rounded-md bg-slate-900 p-3" key={notification._id}>
                  <p className="text-sm font-semibold text-white">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {notification.message}
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
