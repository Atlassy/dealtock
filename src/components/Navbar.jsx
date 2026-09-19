// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './notifications/NotificationBell';
import {
  Menu,
  ShoppingBag,
  Package,
  LayoutDashboard,
  User,
  LogOut,
  Search,
  Globe,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Sun,
  Moon,
  UserCircle,
  LogIn,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  X,
  TrendingUp,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://i.ibb.co/PGkjFhwv/Dealtock.png';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦', dir: 'rtl' }
];

const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Home',
  'Beauty',
  'Sports',
  'Books',
  'Automotive',
  'Other'
];

const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fes',
  'Tangier',
  'Agadir',
  'Meknes',
  'Oujda',
  'Kenitra',
  'Tetouan',
  'Sale',
  'Temara'
];

// Approximate city-center coordinates, used to find the nearest city to the
// browser's geolocation without depending on a paid reverse-geocoding API.
const CITY_COORDS = {
  Casablanca: [33.5731, -7.5898],
  Rabat: [34.0209, -6.8416],
  Marrakech: [31.6295, -7.9811],
  Fes: [34.0331, -5.0003],
  Tangier: [35.7595, -5.8340],
  Agadir: [30.4278, -9.5981],
  Meknes: [33.8935, -5.5473],
  Oujda: [34.6814, -1.9086],
  Kenitra: [34.2610, -6.5802],
  Tetouan: [35.5785, -5.3684],
  Sale: [34.0531, -6.7985],
  Temara: [33.9287, -6.9061]
};

const DELIVERY_CITY_KEY = 'dealtock_delivery_city';

const nearestMoroccanCity = (lat, lng) => {
  const toRad = (v) => (v * Math.PI) / 180;

  let closest = null;
  let closestDist = Infinity;

  for (const [city, [cLat, cLng]] of Object.entries(CITY_COORDS)) {
    const dLat = toRad(cLat - lat);
    const dLng = toRad(cLng - lng);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) *
        Math.cos(toRad(cLat)) *
        Math.sin(dLng / 2) ** 2;

    const dist = 2 * Math.asin(Math.sqrt(a));

    if (dist < closestDist) {
      closestDist = dist;
      closest = city;
    }
  }

  return closest;
};

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

// -----------------------------------------------------------------------------
// Promo Banner
// -----------------------------------------------------------------------------

const PromoBanner = ({ userRole }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const getSlides = () => {
    if (userRole === 'dropshipper' || userRole === 'seller') {
      return [
        {
          text: '🚀 Premium Membership: 80% off commission fees!',
          button: 'Upgrade Now',
          buttonLink: '/upgrade',
          bgColor: 'from-purple-600 to-purple-800'
        },
        {
          image:
            'https://i.ibb.co/p6DbHWds/openart-gpt-image-2-1-1777738487534-0c44fef4.png',
          alt: 'Bulk Order Discounts up to 40%',
          overlayButton: 'Learn More',
          overlayButtonLink: '/promotions/bulk-orders'
        },
        {
          text: '🏆 Become a Top Seller - Get Featured',
          button: 'Apply Now',
          buttonLink: '/apply',
          bgColor: 'from-amber-600 to-amber-800'
        }
      ];
    }

    return [
      {
        text: '🎉 Summer Sale! Up to 50% off on Electronics',
        button: 'Shop Now',
        buttonLink: '/marketplace',
        bgColor: 'from-red-600 to-red-800'
      },
      {
        text: '✨ New Arrivals in Fashion - Shop Now!',
        button: 'Explore',
        buttonLink: '/marketplace',
        bgColor: 'from-pink-600 to-pink-800'
      },
      {
        text: '🚚 Free Delivery on orders over 500 MAD',
        button: 'Shop Now',
        buttonLink: '/marketplace',
        bgColor: 'from-green-600 to-green-800'
      }
    ];
  };

  const slides = getSlides();

  useEffect(() => {
    if (!isHovering && slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isHovering, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  if (slides.length === 0) return null;

  const current = slides[currentSlide];

  return (
    <div
      className="relative overflow-hidden w-full rounded-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative w-full h-24 sm:h-32 md:h-36 lg:h-40">

        {/* IMAGE SLIDE */}
        {current.image && (
          <div className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out opacity-100 z-10">
            <img
              src={current.image}
              alt={current.alt || 'Promotion banner'}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://placehold.co/1200x200/1e3a8a/white?text=Special+Offer';
                e.target.alt =
                  'Promotion image temporarily unavailable';
              }}
            />

            {current.overlayButton && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <Link
                  to={current.overlayButtonLink || '/'}
                  className="bg-white text-gray-900 px-4 py-1.5 md:px-6 md:py-2 rounded-full font-semibold text-xs md:text-sm hover:bg-gray-100 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  {current.overlayButton}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TEXT SLIDE */}
        {!current.image && current.text && (
          <div className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out opacity-100 z-10">
            <div
              className={`w-full h-full bg-gradient-to-r ${current.bgColor} relative flex items-center justify-center`}
            >
              <div className="text-center text-white px-4">
                <p className="text-sm md:text-lg lg:text-xl font-bold mb-2">
                  {current.text}
                </p>

                <Link
                  to={current.buttonLink || '/'}
                  className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-[#febd69] text-gray-900 rounded-md text-xs md:text-sm font-semibold hover:bg-[#f3a847] transition"
                >
                  {current.button}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous promotion"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next promotion"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {slides.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to promotion ${index + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-3'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Navbar
// -----------------------------------------------------------------------------

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut } = useAuth();

  const {
    notifications,
    unreadCount,
    open: notifOpen,
    setOpen: setNotifOpen,
    markAsRead,
    markAllAsRead
  } = useNotifications(user);

  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [cartCount, setCartCount] = useState(0);

  const [language, setLanguage] = useState(
    i18n.language || localStorage.getItem('language') || 'fr'
  );

  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );

  // Admin Products / Inventory submenu
  const [productsMenuOpen, setProductsMenuOpen] = useState(
    location.pathname.startsWith('/admin/products') ||
      location.pathname === '/inventory'
  );

  const languageMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const deliveryPickerRef = useRef(null);

  const isMarketplacePage =
    location.pathname === '/' ||
    location.pathname === '/marketplace';

  const userRole = profile?.role || (user ? 'customer' : 'guest');

  // ---------------------------------------------------------------------------
  // Keep Admin Products / Inventory submenu synchronized with route
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (
      location.pathname.startsWith('/admin/products') ||
      location.pathname === '/inventory'
    ) {
      setProductsMenuOpen(true);
    }
  }, [location.pathname]);

  // ---------------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------------

  const fetchCartCount = () => {
    try {
      const cart = JSON.parse(
        localStorage.getItem('cart') || '[]'
      );

      setCartCount(Array.isArray(cart) ? cart.length : 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener(
        'cartUpdated',
        handleCartUpdate
      );
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Sidebar outside click
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, [sidebarOpen]);

  // ---------------------------------------------------------------------------
  // Language direction
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const selectedLanguage = languages.find(
      (l) => l.code === language
    );

    document.documentElement.dir =
      selectedLanguage?.dir || 'ltr';

    localStorage.setItem('language', language);
  }, [language]);

  // ---------------------------------------------------------------------------
  // Dark mode
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // ---------------------------------------------------------------------------
  // Auto-detect delivery city
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const savedCity = localStorage.getItem(
      DELIVERY_CITY_KEY
    );

    if (savedCity) {
      setCity(savedCity);
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detected = nearestMoroccanCity(
          position.coords.latitude,
          position.coords.longitude
        );

        if (detected) {
          setCity(detected);
          localStorage.setItem(
            DELIVERY_CITY_KEY,
            detected
          );
        }
      },
      () => {
        // Permission denied or unavailable.
        // User can select the city manually.
      },
      {
        timeout: 8000
      }
    );
  }, []);

  const handleSelectDeliveryCity = (selected) => {
    setCity(selected);

    localStorage.setItem(
      DELIVERY_CITY_KEY,
      selected
    );

    setShowDeliveryPicker(false);
  };

  // ---------------------------------------------------------------------------
  // Outside click for menus
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleClickOutsideMenus = (event) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target)
      ) {
        setShowLanguageMenu(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        deliveryPickerRef.current &&
        !deliveryPickerRef.current.contains(event.target)
      ) {
        setShowDeliveryPicker(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutsideMenus
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutsideMenus
      );
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  const handleSearch = (e) => {
    e?.preventDefault();

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }

    if (category) {
      params.append('category', category);
    }

    if (city) {
      params.append('city', city);
    }

    if (condition) {
      params.append('condition', condition);
    }

    if (sortBy && sortBy !== 'newest') {
      params.append('sort', sortBy);
    }

    if (minPrice) {
      params.append('min_price', minPrice);
    }

    if (maxPrice) {
      params.append('max_price', maxPrice);
    }

    const queryString = params.toString();

    navigate(
      `/marketplace${
        queryString ? `?${queryString}` : ''
      }`
    );
  };

  // ---------------------------------------------------------------------------
  // Sidebar navigation
  // ---------------------------------------------------------------------------
  //
  // Admin:
  //   Products / Inventory
  //      ├── Approve Product Listing
  //      └── Inventory
  //
  // Seller:
  //   Inventory
  //
  // Dropshipper:
  //   Dropshipper-specific navigation
  // ---------------------------------------------------------------------------

  const sidebarNavItems = user
    ? [
        {
          path: '/marketplace',
          label: t('navbar.sidebar.marketplace'),
          icon: ShoppingBag,
          roles: ['seller', 'admin', 'dropshipper']
        },

        // Admin-only Products / Inventory parent
        {
          path: '/admin/products',
          label: 'Products / Inventory',
          icon: Package,
          roles: ['admin'],
          children: [
            {
              path: '/admin/products/approve',
              label: 'Approve Product Listing'
            },
            {
              path: '/inventory',
              label: t('navbar.sidebar.inventory')
            }
          ]
        },

        // Seller keeps direct Inventory access
        {
          path: '/inventory',
          label: t('navbar.sidebar.inventory'),
          icon: Package,
          roles: ['seller']
        },

        {
          path: '/dashboard',
          label: t('navbar.dashboard'),
          icon: LayoutDashboard,
          roles: ['seller', 'admin', 'dropshipper']
        },

        {
          path: '/profile',
          label: t('navbar.profile'),
          icon: User,
          roles: ['seller', 'admin', 'dropshipper']
        },

        {
          path: '/dropshipper/orders',
          label: t('navbar.myOrders'),
          icon: Package,
          roles: ['dropshipper']
        },

        {
          path: '/dropshipper/customers',
          label: t('navbar.sidebar.customers'),
          icon: Users,
          roles: ['dropshipper']
        },

        {
          path: '/dropshipper/earnings',
          label: t('navbar.sidebar.earnings'),
          icon: TrendingUp,
          roles: ['dropshipper']
        }
      ].filter((item) => {
        if (!item.roles) return true;

        if (!profile?.role) return false;

        return item.roles.includes(profile.role);
      })
    : [];

  // ---------------------------------------------------------------------------
  // Language
  // ---------------------------------------------------------------------------

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    setShowLanguageMenu(false);

    const selectedLanguage = languages.find(
      (lang) => lang.code === code
    );

    toast.success(
      t('navbar.languageChanged', {
        language: selectedLanguage?.name
      })
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* ===================================================================== */}
      {/* TOP NAVBAR                                                           */}
      {/* ===================================================================== */}

      <div className="bg-[#FEDEB8] dark:bg-[#1a1a2e] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">

          {/* Mobile-optimised top bar:
              menu + logo | social | actions */}
          <div className="flex items-center justify-between h-14 gap-2">

            {/* LEFT: hamburger + logo + delivery */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {user && (
                <button
                  type="button"
                  ref={menuButtonRef}
                  onClick={() =>
                    setSidebarOpen(!sidebarOpen)
                  }
                  aria-label="Toggle navigation menu"
                  aria-expanded={sidebarOpen}
                  className="p-1.5 hover:bg-[#5C3A21] dark:hover:bg-[#febd69] hover:text-white dark:hover:text-gray-900 rounded-lg transition text-[#5C3A21] dark:text-gray-200"
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              )}

              <Link
                to="/"
                className="flex items-center flex-shrink-0"
              >
                <img
                  src={LOGO_URL}
                  alt="Dealtock"
                  className="h-8 w-auto object-contain"
                />
              </Link>

              {/* Deliver-to: desktop only */}
              <div
                className="hidden lg:block relative ml-1"
                ref={deliveryPickerRef}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowDeliveryPicker(
                      !showDeliveryPicker
                    )
                  }
                  className="flex items-center gap-1 px-2 py-1 hover:bg-[#5C3A21] dark:hover:bg-[#febd69] hover:text-white dark:hover:text-gray-900 rounded-lg transition cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-[#5C3A21] dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900" />

                  <div className="text-[#5C3A21] dark:text-gray-200 group-hover:text-white dark:group-hover:text-gray-900 text-xs">
                    <p className="text-[10px] text-[#8B6B4A] dark:text-gray-400 group-hover:text-white/80">
                      {t('navbar.deliverTo')}
                    </p>

                    <p className="font-medium text-sm">
                      {city || t('navbar.morocco')}
                    </p>
                  </div>
                </button>

                {showDeliveryPicker && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                    {MOROCCAN_CITIES.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() =>
                          handleSelectDeliveryCity(c)
                        }
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          c === city
                            ? 'font-semibold text-[#5C3A21] dark:text-[#febd69]'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CENTRE: social links */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"
              >
                <Facebook className="w-4 h-4" />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"
              >
                <Twitter className="w-4 h-4" />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href="#"
                aria-label="YouTube"
                className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            {/* RIGHT: action icons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">

              {/* Contact info — desktop only */}
              <div className="hidden lg:flex items-center gap-3 text-xs mr-1">
                <div className="flex items-center gap-1 text-[#5C3A21] dark:text-gray-300">
                  <Phone className="w-3 h-3" />
                  <span>+212 5XX XXX XXX</span>
                </div>

                <div className="flex items-center gap-1 text-[#5C3A21] dark:text-gray-300">
                  <Mail className="w-3 h-3" />
                  <span>support@dealtock.ma</span>
                </div>
              </div>

              {/* Language picker */}
              <div
                className="relative"
                ref={languageMenuRef}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowLanguageMenu(
                      !showLanguageMenu
                    )
                  }
                  aria-label="Change language"
                  aria-expanded={showLanguageMenu}
                  className="flex items-center gap-0.5 p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition text-sm rounded-lg"
                >
                  <Globe className="w-4 h-4" />

                  <span className="hidden sm:inline text-xs">
                    {
                      languages.find(
                        (l) => l.code === language
                      )?.flag
                    }
                  </span>
                </button>

                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        type="button"
                        key={lang.code}
                        onClick={() =>
                          changeLanguage(lang.code)
                        }
                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                          language === lang.code
                            ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark mode */}
              <button
                type="button"
                onClick={() =>
                  setDarkMode(!darkMode)
                }
                aria-label={
                  darkMode
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                className="p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition rounded-lg"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* Notifications */}
              {user && (
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  isOpen={notifOpen}
                  setIsOpen={setNotifOpen}
                  onRead={(id) => {
                    const notification =
                      notifications.find(
                        (x) => x.id === id
                      );

                    markAsRead(id);
                    setNotifOpen(false);

                    if (
                      notification?.entity_type ===
                        'order' &&
                      notification.entity_id
                    ) {
                      const destination =
                        profile?.role === 'seller' ||
                        profile?.role === 'pro_seller' ||
                        profile?.role === 'warehouse'
                          ? `/dashboard?view=orders&orderId=${notification.entity_id}`
                          : profile?.role ===
                              'dropshipper'
                            ? `/dropshipper/orders?orderId=${notification.entity_id}`
                            : `/my-orders?orderId=${notification.entity_id}`;

                      navigate(destination);
                    }
                  }}
                  onMarkAllRead={markAllAsRead}
                />
              )}

              {/* Cart */}
              <Link
                to="/cart"
                aria-label="Shopping cart"
                className="relative p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] rounded-lg transition"
              >
                <ShoppingCart className="w-5 h-5" />

                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#5C3A21] dark:bg-[#febd69] text-[#FEDEB8] dark:text-gray-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none px-0.5">
                    {cartCount > 9
                      ? '9+'
                      : cartCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {user ? (
                <div
                  className="relative"
                  ref={userMenuRef}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowUserMenu(!showUserMenu)
                    }
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                    className="flex items-center gap-1 p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition rounded-lg text-sm"
                  >
                    <UserCircle className="w-5 h-5" />

                    <span className="hidden md:inline truncate max-w-[70px] text-xs font-medium">
                      {profile?.full_name?.split(
                        ' '
                      )[0] ||
                        user.email?.split('@')[0]}
                    </span>

                    <ChevronDown className="w-3 h-3 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-50 border border-gray-100 dark:border-gray-700">

                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {profile?.full_name ||
                            'User'}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() =>
                          setShowUserMenu(false)
                        }
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t('navbar.dashboard')}
                      </Link>

                      {(!profile?.role ||
                        profile.role ===
                          'customer') && (
                        <Link
                          to="/my-orders"
                          onClick={() =>
                            setShowUserMenu(false)
                          }
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Package className="w-4 h-4" />
                          {t('navbar.myOrders')}
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() =>
                          setShowUserMenu(false)
                        }
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <User className="w-4 h-4" />
                        {t('navbar.profile')}
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('navbar.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#5C3A21] dark:bg-[#febd69] hover:bg-[#3D2515] dark:hover:bg-[#f3a847] text-[#FEDEB8] dark:text-gray-900 rounded-lg transition text-xs font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('navbar.signIn')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PROMO BANNER                                                         */}
      {/* ===================================================================== */}

      {isMarketplacePage && (
        <div className="w-full px-4 pb-2">
          <PromoBanner userRole={userRole} />
        </div>
      )}

      <div className="h-2" />

      {/* ===================================================================== */}
      {/* MARKETPLACE SEARCH / FILTERS                                         */}
      {/* ===================================================================== */}

      {isMarketplacePage && (
        <div className="sticky top-0 z-40 w-full px-3 pt-1 pb-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200/70 dark:border-gray-700/70">

          {/* Search */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                placeholder={t(
                  'navbar.searchPlaceholder'
                )}
                className="w-full pl-3 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />

              <button
                type="button"
                onClick={handleSearch}
                aria-label={t('navbar.search')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#febd69]"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(!showFilters)
              }
              aria-label="Toggle filters"
              aria-expanded={showFilters}
              className="flex-shrink-0 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  showFilters
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">
                    {t('navbar.category')}
                  </option>

                  {CATEGORIES.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);

                    localStorage.setItem(
                      DELIVERY_CITY_KEY,
                      e.target.value
                    );
                  }}
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">
                    {t('marketplace.city')}
                  </option>

                  {MOROCCAN_CITIES.map((c) => (
                    <option
                      key={c}
                      value={c}
                    >
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                >
                  <option value="">
                    {t('navbar.conditionAny')}
                  </option>

                  {CONDITIONS.map((c) => (
                    <option
                      key={c}
                      value={c.toLowerCase()}
                    >
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                >
                  <option value="newest">
                    {t('navbar.sortNewest')}
                  </option>

                  <option value="price_low">
                    {t('navbar.sortPriceLow')}
                  </option>

                  <option value="price_high">
                    {t('navbar.sortPriceHigh')}
                  </option>

                  <option value="rating">
                    {t('navbar.sortTopRated')}
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(e.target.value)
                  }
                  placeholder="Min MAD"
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                />

                <span className="text-gray-400 text-sm">
                  —
                </span>

                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value)
                  }
                  placeholder="Max MAD"
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex-shrink-0 px-4 py-2.5 bg-[#febd69] hover:bg-[#f3a847] text-gray-900 rounded-lg font-medium text-sm"
                >
                  {t('navbar.search')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SIDEBAR                                                              */}
      {/* ===================================================================== */}

      {user && (
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() =>
                setSidebarOpen(false)
              }
            />
          )}

          <div
            ref={sidebarRef}
            className={`fixed left-0 top-0 bottom-0 z-50 bg-white dark:bg-gray-900 shadow-xl transition-all duration-300 ${
              sidebarOpen
                ? 'translate-x-0 w-64'
                : '-translate-x-full w-64'
            }`}
          >
            <div className="flex flex-col h-full overflow-y-auto">

              {/* Sidebar header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('navbar.menu')}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  aria-label="Close navigation menu"
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar navigation */}
              <nav className="flex-1 py-2">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;

                  // -----------------------------------------------------------
                  // Parent item with children
                  // -----------------------------------------------------------

                  if (item.children) {
                    const isParentActive =
                      location.pathname.startsWith(
                        '/admin/products'
                      ) ||
                      location.pathname ===
                        '/inventory';

                    return (
                      <div
                        key={item.path}
                        className="mx-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setProductsMenuOpen(
                              (open) => !open
                            )
                          }
                          aria-expanded={
                            productsMenuOpen
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isParentActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />

                          <span className="flex-1 text-left text-sm font-medium">
                            {item.label}
                          </span>

                          {productsMenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        {productsMenuOpen && (
                          <div className="ml-8 mt-1 space-y-1">
                            {item.children.map(
                              (child) => {
                                const isChildActive =
                                  location.pathname ===
                                    child.path ||
                                  location.pathname.startsWith(
                                    `${child.path}/`
                                  );

                                return (
                                  <Link
                                    key={child.path}
                                    to={child.path}
                                    onClick={() =>
                                      setSidebarOpen(
                                        false
                                      )
                                    }
                                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                      isChildActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    {child.label}
                                  </Link>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // -----------------------------------------------------------
                  // Normal navigation item
                  // -----------------------------------------------------------

                  const isActive =
                    location.pathname ===
                      item.path ||
                    location.pathname.startsWith(
                      `${item.path}/`
                    );

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() =>
                        setSidebarOpen(false)
                      }
                      className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />

                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Sidebar footer */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Dealtock v1.0</p>
                  <p>
                    © 2024{' '}
                    {t(
                      'navbar.footerTagline'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
