// src/components/Navbar.jsx - UPDATED TO USE PROFILE FROM CONTEXT
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { Home, Store, Package, LayoutDashboard, User, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {
  const { user, profile, signOut } = useAuth(); // Get profile from context
  const [notifications, setNotifications] = useState({ notifications: [], unreadCount: 0 });
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  const userRole = profile?.role; // Get role from profile

  // Fetch notifications
  useEffect(() => {
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

  // Navigation links configuration with role requirements
  const navLinks = [
    { path: "/marketplace", icon: Store, label: "Marketplace", roles: ["all"] },
    { path: "/inventory", icon: Package, label: "Inventory", roles: ["seller", "admin"] },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["all"] },
    { path: "/profile", icon: User, label: "Profile", roles: ["all"] },
    { path: "/settings", icon: Settings, label: "Settings", roles: ["all"] }
  ];

  // Filter links based on user role
  const visibleLinks = navLinks.filter(link => {
    if (link.roles.includes("all")) return true;
    if (userRole && link.roles.includes(userRole)) return true;
    return false;
  });

  // Debug log
  console.log('Navbar - User role:', userRole);
  console.log('Navbar - Visible links:', visibleLinks.map(l => l.label));

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
              {visibleLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* User Email with Role Badge */}
            <span className="hidden lg:block text-sm text-gray-600">
              {user.email}
              {userRole && (
                <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {userRole}
                </span>
              )}
            </span>

            {/* Notification Dropdown */}
            <NotificationBell
              notifications={notifications.notifications || []}
              unreadCount={notifications.unreadCount || 0}
              open={notificationOpen}
              setOpen={setNotificationOpen}
              onRead={markAsRead}
            />
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