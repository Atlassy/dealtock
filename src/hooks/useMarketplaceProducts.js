// src/hooks/useMarketplaceProducts.js
// Sprint 3 — City-locked returned products filter
// Changes:
//   - Fetches source_type, listing_status, city_locked, asking_price
//   - Queries marketplace_products view (admin-safe, no days_in_storage)
//   - Detects buyer city for city-locked filtering
//   - Returns buyerCity + cityLockedCount for UI awareness

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/SupabaseAuthContext';

// ── Moroccan cities for city detection ──────────────────────────────
const MOROCCAN_CITIES = [
  'Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir',
  'Meknès','Oujda','Kenitra','Tétouan','Safi','Mohammedia',
  'Khouribga','Beni Mellal','El Jadida','Nador','Settat',
  'Berrechid','Khémisset','Larache','Ksar El Kebir','Guelmim',
  'Béni Mellal','Taza','Laâyoune','Dakhla'
];

export const useMarketplaceProducts = (filters) => {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [userRole, setUserRole]           = useState(null);
  const [commissionRates, setCommissionRates] = useState({});
  const [buyerCity, setBuyerCity]         = useState(null);   // detected buyer city
  const [cityLockedCount, setCityLockedCount] = useState(0);  // how many deals near buyer
  const { user, profile } = useAuth();

  // ── Fetch user role (use profile from context if available) ────────
  useEffect(() => {
    if (profile?.role) {
      setUserRole(profile.role);
    } else if (user) {
      supabase.from('profiles').select('role, city')
        .eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setUserRole(data.role);
            if (data.city) setBuyerCity(data.city);
          }
        });
    } else {
      setUserRole('b2c');
    }
  }, [user, profile]);

  // ── Detect buyer city from profile ────────────────────────────────
  useEffect(() => {
    if (profile?.city) setBuyerCity(profile.city);
  }, [profile]);

  // ── Fetch commission rates ─────────────────────────────────────────
  useEffect(() => {
    if (!userRole) return;
    const appliesTo =
      userRole === 'dropshipper' ? 'dropshipper' :
      userRole === 'seller'      ? 'Seller'      : 'B2C';

    supabase.from('commission_rules')
      .select('category, percentage, min_amount, max_amount, is_default, priority')
      .eq('applies_to', appliesTo)
      .eq('is_active', true)
      .then(({ data }) => {
        if (!data) return;
        const rates = {};
        data.forEach(rule => {
          const key = rule.category || 'default';
          if (!rates[key]) rates[key] = [];
          rates[key].push(rule);
        });
        setCommissionRates(rates);
      });
  }, [userRole]);

  // ── Commission rate lookup ─────────────────────────────────────────
  const getCommissionRate = useCallback((product) => {
    const basePrice = product.purchase_price || product.asking_price || 0;
    const category  = product.category || 'Other';
    const rules     = [
      ...(commissionRates[category] || []),
      ...(commissionRates['default'] || []),
    ].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of rules) {
      const minOk = rule.min_amount == null || basePrice >= rule.min_amount;
      const maxOk = rule.max_amount == null || basePrice <= rule.max_amount;
      if (minOk && maxOk) return rule.percentage;
    }
    // Fallback
    if (userRole !== 'dropshipper' && userRole !== 'seller') {
      if (basePrice >= 5000) return 10;
      if (basePrice >= 1000) return 20;
      return 30;
    }
    return 0;
  }, [commissionRates, userRole]);

  // ── Price for role ─────────────────────────────────────────────────
  const getPriceForRole = useCallback((product) => {
    // For returned products: use asking_price as the base
    const isReturned = product.source_type === 'returned';
    const basePrice  = isReturned
      ? (product.asking_price || product.purchase_price || 0)
      : (product.purchase_price || 0);

    if (userRole === 'dropshipper' || userRole === 'seller') {
      return {
        price:           basePrice,
        label:           userRole === 'dropshipper' ? 'Wholesale Price' : 'Your Price',
        marketplace_fee: 0,
        commission_rate: 0,
        invalid:         false,
      };
    }

    const commissionRate = getCommissionRate(product);
    const finalPrice     = basePrice * (1 + commissionRate / 100);

    return {
      price:           finalPrice,
      label:           isReturned ? 'Deal Price' : 'Price',
      marketplace_fee: finalPrice - basePrice,
      commission_rate: commissionRate,
      invalid:         false,
    };
  }, [userRole, getCommissionRate]);

  // ── Fetch products ─────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the marketplace_products view — safe for buyers (no admin fields)
      let query = supabase
        .from('marketplace_products')
        .select(`
          id,
          name,
          description,
          category,
          purchase_price,
          asking_price,
          quantity,
          condition,
          status,
          source_type,
          listing_status,
          city_locked,
          image_url,
          city,
          created_at,
          seller_id
        `)
        .gt('quantity', 0);

      // ── Standard filters ──────────────────────────────────────────
      if (filters.search)   query = query.ilike('name', `%${filters.search}%`);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.condition) query = query.eq('condition', filters.condition);
      if (filters.minPrice) query = query.gte('purchase_price', parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte('purchase_price', parseFloat(filters.maxPrice));

      // ── Source type filter (new vs returned) ──────────────────────
      if (filters.sourceType && filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType);
      }

      // ── City filter (explicit filter OR city-locked auto-filter) ──
      if (filters.location) {
        // Explicit city filter from user — show all products in that city
        query = query.eq('city', filters.location);
      } else {
        // No explicit filter: show non-city-locked products + city-locked
        // ones that match buyer's city (if known)
        // PostgREST doesn't support OR across a boolean easily,
        // so we fetch all and filter in JS below
      }

      // ── Sorting ───────────────────────────────────────────────────
      if (filters.sortBy === 'price_low')  query = query.order('purchase_price', { ascending: true });
      else if (filters.sortBy === 'price_high') query = query.order('purchase_price', { ascending: false });
      else if (filters.sortBy === 'name')  query = query.order('name', { ascending: true });
      else                                 query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let results = data || [];

      // ── City-lock filtering (client-side) ─────────────────────────
      // Rules:
      //   city_locked = false → always show
      //   city_locked = true  → only show if buyer city matches product city
      //                         OR buyer city is unknown (show with "local deal" hint)
      if (!filters.location) {
        const lockedDeals = results.filter(p => p.city_locked);
        const cityMatch   = buyerCity
          ? lockedDeals.filter(p =>
              p.city?.toLowerCase() === buyerCity.toLowerCase()
            )
          : lockedDeals; // unknown city → show all locked deals

        const nonLocked = results.filter(p => !p.city_locked);

        // Surface city-matched returned deals first
        const cityMatchedReturned = cityMatch.filter(p => p.source_type === 'returned');
        const cityMatchedOther    = cityMatch.filter(p => p.source_type !== 'returned');

        setCityLockedCount(cityMatch.length);

        // Order: city-matched returned → city-matched other → normal products
        results = [...cityMatchedReturned, ...cityMatchedOther, ...nonLocked];
      } else {
        setCityLockedCount(0);
      }

      setProducts(results);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, buyerCity]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    userRole,
    buyerCity,
    cityLockedCount,
    getPriceForRole,
    refetch: fetchProducts,
  };
};
