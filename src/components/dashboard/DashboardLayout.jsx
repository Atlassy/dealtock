// src/components/dashboard/DashboardLayout.jsx
import React from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Home, 
  Package, 
  ShoppingBag, 
  Users, 
  Truck, 
  Settings,
  BarChart3
} from 'lucide-react';

const DashboardLayout = ({ children, role }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Add your logout logic here
    navigate('/login');
  };

  // Navigation items based on role
  const navItems = {
    admin: [
      { name: 'Dashboard', icon: Home, path: '/admin' },
      { name: 'Users', icon: Users, path: '/admin/users' },
      { name: 'Products', icon: Package, path: '/admin/products' },
      { name: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
      { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
      { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ],
    seller: [
      { name: 'Dashboard', icon: Home, path: '/seller' },
      { name: 'Products', icon: Package, path: '/seller/products' },
      { name: 'Orders', icon: ShoppingBag, path: '/seller/orders' },
      { name: 'Returns', icon: Truck, path: '/seller/returns' },
      { name: 'Analytics', icon: BarChart3, path: '/seller/analytics' },
    ],
    dropshipper: [
      { name: 'Dashboard', icon: Home, path: '/dropshipper' },
      { name: 'Marketplace', icon: ShoppingBag, path: '/dropshipper/marketplace' },
      { name: 'Orders', icon: Package, path: '/dropshipper/orders' },
      { name: 'Customers', icon: Users, path: '/dropshipper/customers' },
      { name: 'Earnings', icon: BarChart3, path: '/dropshipper/earnings' },
    ],
    delivery: [
      { name: 'Dashboard', icon: Home, path: '/delivery' },
      { name: 'Pickups', icon: Package, path: '/delivery/pickups' },
      { name: 'Deliveries', icon: Truck, path: '/delivery/deliveries' },
      { name: 'History', icon: BarChart3, path: '/delivery/history' },
    ]
  };

  const currentNavItems = navItems[role] || navItems.dropshipper;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">DealTock</h1>
          <p className="text-sm text-gray-500 capitalize mt-1">{role} Dashboard</p>
        </div>
        
        <nav className="mt-6">
          {currentNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;