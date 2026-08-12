import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';

const DASHBOARD_ROLES = ['admin', 'seller', 'dropshipper', 'delivery', 'warehouse'];

const BottomNav = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const read = () => {
      setCartCount(Number(localStorage.getItem('cart_count') || 0));
    };
    read();
    window.addEventListener('cartUpdated', read);
    return () => window.removeEventListener('cartUpdated', read);
  }, []);

  const isDashboardRole = profile?.role && DASHBOARD_ROLES.includes(profile.role);
  const isCustomer = !profile?.role || profile.role === 'customer';

  const items = [
    {
      to: '/marketplace',
      icon: Home,
      label: 'Accueil',
      active: location.pathname === '/' || location.pathname === '/marketplace',
    },
    {
      to: '/cart',
      icon: ShoppingCart,
      label: 'Panier',
      active: location.pathname === '/cart',
      badge: cartCount > 0 ? (cartCount > 9 ? '9+' : cartCount) : null,
    },
    ...(user && isCustomer ? [{
      to: '/my-orders',
      icon: Package,
      label: 'Commandes',
      active: location.pathname === '/my-orders',
    }] : []),
    ...(user && isDashboardRole ? [{
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      active: location.pathname.startsWith('/dashboard'),
    }] : []),
    {
      to: user ? '/profile' : '/login',
      icon: User,
      label: user ? 'Compte' : 'Connexion',
      active: location.pathname === '/profile' || location.pathname === '/login',
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                item.active
                  ? 'text-[#5C3A21] dark:text-[#febd69]'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#5C3A21] dark:bg-[#febd69] text-white dark:text-gray-900 text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center leading-none px-0.5">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {item.active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#5C3A21] dark:bg-[#febd69] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
