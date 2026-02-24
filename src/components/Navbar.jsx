// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Home, Store } from "lucide-react"; // ✅ Added Store icon
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import NotificationBell from "@/components/notifications/NotificationBell";


export default function Navbar() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState({ notifications: [], unreadCount: 0 });
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (data) {
            const unread = data.filter(n => !n.read).length;
            setNotifications({
              notifications: data,
              unreadCount: unread
            });
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      
      // Update local state
      setNotifications(prev => ({
        notifications: prev.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 border-b bg-white shadow-sm sticky top-0 z-40">
      {/* Logo/Brand */}
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl text-gray-900">Dealtock</span>
      </Link>

      {/* Right Side: Navigation & Notifications */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              {/* ✅ Added Marketplace Link */}
              <Link 
                to="/marketplace" 
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Marketplace</span>
              </Link>
              
              <Link 
                to="/dashboard" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/profile" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Profile
              </Link>
              <Link 
                to="/settings" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={signOut}
                className="text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Notification Dropdown */}
            <NotificationBell
              notifications={notifications.notifications || []}
              unreadCount={notifications.unreadCount || 0}
              open={notificationOpen}
              setOpen={setNotificationOpen}
              onRead={markAsRead}
            />

            {/* Mobile Menu Icon (Optional) */}
            <div className="md:hidden">
              {/* You can add a hamburger menu here if needed */}
            </div>
          </>
        ) : (
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}