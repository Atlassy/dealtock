import { Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  open,
  setOpen,
  onRead,
  mobile = false
}) {
  
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await onRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition ${
          mobile 
            ? "text-gray-700 hover:bg-gray-100" 
            : "text-white hover:bg-white/10"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className={`absolute ${
              mobile ? "right-0" : "right-0"
            } mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden`}
          >
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && onRead(notification.id)}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                      notification.is_read ? "opacity-75" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-sm font-medium ${
                        notification.is_read ? "text-gray-700" : "text-gray-900"
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.created_at)}
                    </span>
                      {notification.is_read && (
                        <span className="text-xs text-gray-400">Read</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {/* Navigate to notifications page */}}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}