// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { 
  Menu, ShoppingBag, Package, LayoutDashboard, User, LogOut,
  Search, Globe, ChevronDown, ChevronLeft, ChevronRight,
  ShoppingCart, Sun, Moon, UserCircle, LogIn, MapPin,
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, X,
  TrendingUp, Users
} from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://i.ibb.co/PGkjFhwv/Dealtock.png';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦', dir: 'rtl' }
];

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Beauty", "Sports", "Books", "Automotive", "Other"];
const MOROCCAN_CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", 
  "Meknes", "Oujda", "Kenitra", "Tetouan", "Sale", "Temara"
];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

// ✅ FIXED Promo Banner Component - Handles images correctly
const PromoBanner = ({ userRole }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const getSlides = () => {
    if (userRole === 'dropshipper' || userRole === 'seller') {
      return [
        { 
          text: "🚀 Premium Membership: 80% off commission fees!", 
          button: "Upgrade Now", 
          buttonLink: "/upgrade",
          bgColor: "from-purple-600 to-purple-800" 
        },
        { 
          image: "https://i.ibb.co/p6DbHWds/openart-gpt-image-2-1-1777738487534-0c44fef4.png",
          alt: "Bulk Order Discounts up to 40%",
          overlayButton: "Learn More",
          overlayButtonLink: "/promotions/bulk-orders"
        },
        { 
          text: "🏆 Become a Top Seller - Get Featured", 
          button: "Apply Now", 
          buttonLink: "/apply",
          bgColor: "from-amber-600 to-amber-800" 
        }
      ];
    } else {
      return [
        { text: "🎉 Summer Sale! Up to 50% off on Electronics", button: "Shop Now", buttonLink: "/marketplace", bgColor: "from-red-600 to-red-800" },
        { text: "✨ New Arrivals in Fashion - Shop Now!", button: "Explore", buttonLink: "/marketplace", bgColor: "from-pink-600 to-pink-800" },
        { text: "🚚 Free Delivery on orders over 500 MAD", button: "Shop Now", buttonLink: "/marketplace", bgColor: "from-green-600 to-green-800" }
      ];
    }
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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  if (slides.length === 0) return null;

  const current = slides[currentSlide];

  return (
    <div 
      className="relative overflow-hidden w-full rounded-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative w-full h-32 md:h-36 lg:h-40">
        
        {/* ✅ IMAGE SLIDE */}
        {current.image && (
          <div className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out opacity-100 z-10">
            <img
              src={current.image}
              alt={current.alt || "Promotion banner"}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/1200x200/1e3a8a/white?text=Special+Offer";
                e.target.alt = "Promotion image temporarily unavailable";
              }}
            />
            {current.overlayButton && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <a
                  href={current.overlayButtonLink || "#"}
                  className="bg-white text-gray-900 px-4 py-1.5 md:px-6 md:py-2 rounded-full font-semibold text-xs md:text-sm hover:bg-gray-100 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  {current.overlayButton}
                </a>
              </div>
            )}
          </div>
        )}

        {/* ✅ TEXT SLIDE */}
        {!current.image && current.text && (
          <div className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out opacity-100 z-10`}>
            <div className={`w-full h-full bg-gradient-to-r ${current.bgColor} relative flex items-center justify-center`}>
              <div className="text-center text-white px-4">
                <p className="text-sm md:text-lg lg:text-xl font-bold mb-2">{current.text}</p>
                <a
                  href={current.buttonLink || "#"}
                  className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-[#febd69] text-gray-900 rounded-md text-xs md:text-sm font-semibold hover:bg-[#f3a847] transition"
                >
                  {current.button}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white w-3' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ✅ Main Navbar Component (unchanged from your original)
const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const languageMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  const isMarketplacePage = location.pathname === '/' || location.pathname === '/marketplace';
  const userRole = profile?.role || (user ? 'customer' : 'guest');

  const fetchCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          menuButtonRef.current &&
          !menuButtonRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  useEffect(() => {
    document.documentElement.dir = languages.find(l => l.code === language)?.dir || 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutsideMenus = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMenus);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenus);
  }, []);

  useEffect(() => {
    fetchCartCount();
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (category && category !== '') params.append('category', category);
    if (city && city !== '') params.append('city', city);
    if (condition && condition !== '') params.append('condition', condition);
    if (sortBy && sortBy !== 'newest') params.append('sort', sortBy);
    if (minPrice && minPrice !== '') params.append('min_price', minPrice);
    if (maxPrice && maxPrice !== '') params.append('max_price', maxPrice);
    const queryString = params.toString();
    navigate(`/marketplace${queryString ? `?${queryString}` : ''}`);
  };

  const sidebarNavItems = user ? [
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag, roles: ['seller', 'admin', 'dropshipper'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['seller', 'admin'] },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['seller', 'admin', 'dropshipper'] },
    { path: '/profile', label: 'Profile', icon: User, roles: ['seller', 'admin', 'dropshipper'] },
    { path: '/dropshipper/orders', label: 'My Orders', icon: Package, roles: ['dropshipper'] },
    { path: '/dropshipper/customers', label: 'Customers', icon: Users, roles: ['dropshipper'] },
    { path: '/dropshipper/earnings', label: 'Earnings', icon: TrendingUp, roles: ['dropshipper'] }
  ].filter(item => {
    if (!item.roles) return true;
    if (!profile?.role) return false;
    return item.roles.includes(profile.role);
  }) : [];

  const changeLanguage = (code) => {
    setLanguage(code);
    setShowLanguageMenu(false);
    toast.success(`Language changed to ${languages.find(l => l.code === code)?.name}`);
  };

  return (
    <>
      <div className="bg-[#FEDEB8] dark:bg-[#1a1a2e] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile-optimised top bar: 3 zones — menu+logo | (spacer) | actions */}
          <div className="flex items-center justify-between h-14 gap-2">

            {/* LEFT: hamburger + logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && (
                <button
                  ref={menuButtonRef}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 hover:bg-[#5C3A21] dark:hover:bg-[#febd69] hover:text-white dark:hover:text-gray-900 rounded-lg transition text-[#5C3A21] dark:text-gray-200"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <Link to="/" className="flex items-center flex-shrink-0">
                <img src={LOGO_URL} alt="Dealtock" className="h-8 w-auto object-contain" />
              </Link>
              {/* Deliver-to: desktop only */}
              <div className="hidden lg:flex items-center gap-1 ml-1 px-2 py-1 hover:bg-[#5C3A21] dark:hover:bg-[#febd69] hover:text-white dark:hover:text-gray-900 rounded-lg transition cursor-pointer group">
                <MapPin className="w-4 h-4 text-[#5C3A21] dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900" />
                <div className="text-[#5C3A21] dark:text-gray-200 group-hover:text-white dark:group-hover:text-gray-900 text-xs">
                  <p className="text-[10px] text-[#8B6B4A] dark:text-gray-400 group-hover:text-white/80">Deliver to</p>
                  <p className="font-medium text-sm">Morocco</p>
                </div>
              </div>
            </div>

            {/* CENTRE: social links — hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <a href="#" className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"><Facebook className="w-4 h-4" /></a>
              <a href="#" className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition"><Youtube className="w-4 h-4" /></a>
            </div>

            {/* RIGHT: compact action icons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">

              {/* Contact info — desktop only */}
              <div className="hidden lg:flex items-center gap-3 text-xs mr-1">
                <div className="flex items-center gap-1 text-[#5C3A21] dark:text-gray-300"><Phone className="w-3 h-3" /><span>+212 5XX XXX XXX</span></div>
                <div className="flex items-center gap-1 text-[#5C3A21] dark:text-gray-300"><Mail className="w-3 h-3" /><span>support@dealtock.ma</span></div>
              </div>

              {/* Language picker */}
              <div className="relative" ref={languageMenuRef}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-0.5 p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition text-sm rounded-lg"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{languages.find(l => l.code === language)?.flag}</span>
                </button>
                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                    {languages.map((lang) => (
                      <button key={lang.code} onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${language === lang.code ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        <span>{lang.flag}</span><span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition rounded-lg"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Cart */}
              <Link to="/cart" className="relative p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] rounded-lg transition">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#5C3A21] dark:bg-[#febd69] text-[#FEDEB8] dark:text-gray-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1 p-1.5 text-[#5C3A21] dark:text-gray-300 hover:text-[#3D2515] dark:hover:text-[#febd69] transition rounded-lg text-sm"
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="hidden md:inline truncate max-w-[70px] text-xs font-medium">
                      {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 hidden sm:block" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-50 border border-gray-100 dark:border-gray-700">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                      <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"><User className="w-4 h-4" /> Profile</Link>
                      <button onClick={() => { signOut(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"><LogOut className="w-4 h-4" /> Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1 px-2.5 py-1.5 bg-[#5C3A21] dark:bg-[#febd69] hover:bg-[#3D2515] dark:hover:bg-[#f3a847] text-[#FEDEB8] dark:text-gray-900 rounded-lg transition text-xs font-semibold">
                  <LogIn className="w-4 h-4" /><span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMarketplacePage && (
        <div className="w-full px-4 pb-2">
          <PromoBanner userRole={userRole} />
        </div>
      )}

      <div className="h-2"></div>

      {isMarketplacePage && (
        <div className="w-full px-4 pt-1">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex-shrink-0">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="">Category</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex-1 relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              <button onClick={handleSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#febd69]"><Search className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="">City</option>
                {MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleSearch} className="px-4 py-2 bg-[#febd69] hover:bg-[#f3a847] text-gray-900 rounded font-medium text-sm">Search</button>
              <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1">
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} /> Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                  <option value="">Condition: Any</option>
                  {CONDITIONS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
                  <span className="text-gray-500">-</span>
                  <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                  <option value="newest">Sort: Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {user && (
        <>
          {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
          <div ref={sidebarRef} className={`fixed left-0 top-0 bottom-0 z-50 bg-white dark:bg-gray-900 shadow-xl transition-all duration-300 ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}>
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 py-2">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                      <Icon className="w-5 h-5 flex-shrink-0" /><span className="block text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400"><p>Dealtock v1.0</p><p>© 2024 All rights reserved</p></div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;