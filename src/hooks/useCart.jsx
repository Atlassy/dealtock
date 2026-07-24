// src/hooks/useCart.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabaseClient';

const CART_EXPIRATION_DAYS = 7;
const LEGACY_GUEST_KEY = 'cart';
const GUEST_CART_KEY = 'cart_guest';

export const useCart = () => {
  const { user, profile } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commissionRules, setCommissionRules] = useState([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);

  const channelRef = useRef(null);
  const isSyncingRef = useRef(false);

  // -----------------------------
  // FETCH COMMISSION RULES
  // -----------------------------
  useEffect(() => {
    const fetchCommissionRules = async () => {
      console.log('📡 Fetching commission rules...');
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!error && data) {
        const processed = data.map(r => ({
          ...r,
          min_amount: r.min_amount !== null ? Number(r.min_amount) : 0,
          max_amount: r.max_amount !== null ? Number(r.max_amount) : Infinity,
          percentage: Number(r.percentage),
          category: r.category || 'default',
          applies_to: (r.applies_to || '').toLowerCase().trim(),
        }));
        console.log('✅ Commission rules loaded:', processed.length);
        setCommissionRules(processed);
        setRulesLoaded(true);
      }
    };
    fetchCommissionRules();
  }, []);

  // -----------------------------
  // FIND COMMISSION RULE
  // -----------------------------
  const findCommissionRule = useCallback((category, price, role) => {
    if (!commissionRules.length) return null;

    let applies = (role || 'customer').toLowerCase();
    if (applies === 'customer') applies = 'b2c';
    if (applies === 'admin') applies = 'seller';

    const cat = category || 'default';
    const p = Number(price);

    // First try exact category match
    let rule = commissionRules.find(r =>
      r.applies_to === applies &&
      r.category === cat &&
      p >= r.min_amount &&
      p <= r.max_amount
    );

    // If no exact match, try default category
    if (!rule) {
      rule = commissionRules.find(r =>
        r.applies_to === applies &&
        r.category === 'default' &&
        p >= r.min_amount &&
        p <= r.max_amount
      );
    }

    return rule;
  }, [commissionRules]);

  // -----------------------------
  // GET ROLE-BASED PRICE (FIXED - WITH FALLBACKS)
  // -----------------------------
  const getRoleBasedPrice = useCallback((product) => {
    // If product has no data, return 0
    if (!product) return 0;

    const basePrice = Number(product.purchase_price || 0);
    
    // If no user or customer role - use B2C pricing
    if (!user || !profile?.role || profile.role === 'customer') {
      if (basePrice > 0) {
        // ── PRIX FIX ─────────────────────────────────────────────
        // On ne retourne PAS sale_price directement car dans AddProductForm
        // sale_price = purchase_price (pas de commission incluse).
        // On calcule toujours depuis purchase_price + règle de commission B2C.
        const rule = findCommissionRule(product.category, basePrice, 'B2C');
        if (rule) {
          const finalPrice = basePrice * (1 + rule.percentage / 100);
          console.log(\`💰 B2C price for \${product.name}: \${basePrice} + \${rule.percentage}% = \${finalPrice}\`);
          return Number(finalPrice.toFixed(2));
        }
        // Default B2C markup 20% (cohérent avec AddProductForm preview)
        console.log(\`💰 B2C fallback for \${product.name}: \${basePrice} * 1.2 = \${basePrice * 1.2}\`);
        return Number((basePrice * 1.2).toFixed(2));
      }
      return 0;
    }

    // Dropshipper pricing
    if (profile.role === 'dropshipper') {
      if (basePrice === 0) return 0;
      
      const rule = findCommissionRule(product.category, basePrice, 'dropshipper');
      if (rule) {
        const finalPrice = basePrice * (1 + rule.percentage / 100);
        console.log(`💰 Dropshipper price for ${product.name}: ${basePrice} + ${rule.percentage}% = ${finalPrice}`);
        return Number(finalPrice.toFixed(2));
      }
      // Default dropshipper markup 10%
      console.log(`💰 Dropshipper fallback for ${product.name}: ${basePrice} * 1.1 = ${basePrice * 1.1}`);
      return Number((basePrice * 1.1).toFixed(2));
    }

    // Seller/Admin pricing - just purchase price
    if (profile.role === 'seller' || profile.role === 'admin' || profile.role === 'warehouser') {
      return Number(basePrice);
    }

    // Fallback
    return Number(basePrice);
  }, [user, profile, findCommissionRule]);

  // -----------------------------
  // GET CART ITEMS WITH PRICES
  // -----------------------------
  const getCartItemsWithPrices = useCallback(async (items) => {
    if (!items.length) return [];

    const productIds = items.map(i => i.id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sale_price, purchase_price, quantity, category, image_url, location, condition')
      .in('id', productIds);

    if (error || !products) {
      console.error('Error fetching products:', error);
      return items;
    }

    const productMap = {};
    products.forEach(p => productMap[p.id] = p);

    return items.map(item => {
      const product = productMap[item.id];
      if (!product) return item;

      const price = getRoleBasedPrice(product);
      // ── PRIX FIX: originalB2CPrice calculé depuis purchase_price + commission ──
      const b2cBase = Number(product.purchase_price || 0);
      const b2cRule = findCommissionRule(product.category, b2cBase, 'B2C');
      const b2cPrice = b2cBase > 0
        ? (b2cRule ? b2cBase * (1 + b2cRule.percentage / 100) : b2cBase * 1.2)
        : 0;

      return {
        ...item,
        name: product.name,
        price: price,
        originalB2CPrice: b2cPrice,
        stock: product.quantity,
        category: product.category,
        image_url: product.image_url || item.image_url,
        location: product.location,
        condition: product.condition,
      };
    });
  }, [getRoleBasedPrice]);

  // -----------------------------
  // MIGRATE LEGACY CART
  // -----------------------------
  const migrateLegacyCart = useCallback(() => {
    const legacyCart = localStorage.getItem(LEGACY_GUEST_KEY);
    if (legacyCart) {
      const parsedCart = JSON.parse(legacyCart);
      if (parsedCart.length > 0) {
        console.log('🔄 Migrating legacy cart to new format:', parsedCart.length, 'items');
        localStorage.setItem(GUEST_CART_KEY, legacyCart);
        return parsedCart;
      }
    }
    return null;
  }, []);

  // -----------------------------
  // SAVE CART
  // -----------------------------
  const saveCart = useCallback(async (items) => {
    try {
      if (user) {
        // user_carts is one row per (user_id, product_id) — sync by
        // deleting rows no longer in the cart, then upserting the rest.
        const productIds = items.map(i => i.id);

        if (productIds.length > 0) {
          await supabase
            .from('user_carts')
            .delete()
            .eq('user_id', user.id)
            .not('product_id', 'in', `(${productIds.join(',')})`);

          const { error } = await supabase
            .from('user_carts')
            .upsert(
              items.map(item => ({
                user_id: user.id,
                product_id: item.id,
                quantity: item.quantity,
                updated_at: new Date().toISOString()
              })),
              { onConflict: 'user_id,product_id' }
            );

          if (error) throw error;
        } else {
          await supabase.from('user_carts').delete().eq('user_id', user.id);
        }
      } else {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      }

      setCartItems(items);
      window.dispatchEvent(new Event('cartUpdated'));

    } catch (err) {
      console.error('Save cart error:', err);
    }
  }, [user]);

  // -----------------------------
  // LOAD CART
  // -----------------------------
  const loadCart = useCallback(async () => {
    setLoading(true);

    try {
      let items = [];

      if (user) {
        console.log('📡 Loading cart from Supabase for user:', user.id);

        // user_carts is one row per (user_id, product_id), not a single
        // JSONB blob — read all rows for this user and map to the shape
        // the rest of the app expects.
        const { data, error } = await supabase
          .from('user_carts')
          .select('product_id, quantity')
          .eq('user_id', user.id);

        if (!error && data) {
          items = data.map(row => ({ id: row.product_id, quantity: row.quantity }));
          console.log('📦 Loaded', items.length, 'items from Supabase');

          // Update prices with current user role
          if (items.length > 0 && rulesLoaded) {
            items = await getCartItemsWithPrices(items);
          }
        }

        // Merge guest cart
        let guestCart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        if (guestCart.length === 0) {
          const legacyCart = migrateLegacyCart();
          if (legacyCart) guestCart = legacyCart;
        }

        if (guestCart.length > 0) {
          console.log('🔄 Merging guest cart:', guestCart.length, 'items');
          const merged = {};
          [...items, ...guestCart].forEach(item => {
            if (merged[item.id]) {
              merged[item.id].quantity += item.quantity;
            } else {
              merged[item.id] = { ...item };
            }
          });
          items = Object.values(merged);

          localStorage.removeItem(GUEST_CART_KEY);
          localStorage.removeItem(LEGACY_GUEST_KEY);

          // Update prices for merged items
          if (items.length > 0 && rulesLoaded) {
            items = await getCartItemsWithPrices(items);
          }

          await saveCart(items);
        }

      } else {
        // Guest user
        let items = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        if (items.length === 0) {
          const legacyCart = migrateLegacyCart();
          if (legacyCart) {
            items = legacyCart;
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
          }
        }

        // Update prices for guest
        if (items.length > 0 && rulesLoaded) {
          items = await getCartItemsWithPrices(items);
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
        }

        console.log('📦 Loaded', items.length, 'items from localStorage (guest)');
        setCartItems(items);
        setLoading(false);
        return;
      }

      setCartItems(items);

    } catch (err) {
      console.error('Load cart error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, rulesLoaded, getCartItemsWithPrices, migrateLegacyCart, saveCart]);

  // -----------------------------
  // ACTIONS
  // -----------------------------
  // In useCart.js, update addToCart to store seller_id
const addToCart = useCallback(async (product, qty = 1, preCalculatedPrice = null) => {
  // Fetch fresh product data to verify stock
  const { data: freshProduct, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', product.id)
    .single();

  if (error || !freshProduct) return false;

  // ── PRIX FIX ─────────────────────────────────────────────────
  // Priorité: prix pré-calculé par la marketplace (déjà avec commission B2C)
  // Fallback: recalcul local (pour les ajouts hors marketplace)
  const price = preCalculatedPrice !== null && preCalculatedPrice > 0
    ? Number(preCalculatedPrice)
    : getRoleBasedPrice(freshProduct);

  const existing = cartItems.find(i => i.id === product.id);

  let updated;
  if (existing) {
    updated = cartItems.map(i =>
      i.id === product.id
        ? { ...i, quantity: i.quantity + qty, price }
        : i
    );
  } else {
    updated = [
      ...cartItems,
      {
        id: freshProduct.id,
        name: freshProduct.name,
        price,
        quantity: qty,
        image_url: freshProduct.image_url,
        category: freshProduct.category,
        originalB2CPrice: freshProduct.sale_price || (freshProduct.purchase_price * 1.3),
        stock: freshProduct.quantity,
        location: freshProduct.location,
        condition: freshProduct.condition,
        seller_id: freshProduct.user_id,
      }
    ];
  }

  await saveCart(updated);
  return true;
}, [cartItems, saveCart, getRoleBasedPrice]);
  const removeItem = useCallback(async (id) => {
    await saveCart(cartItems.filter(i => i.id !== id));
  }, [cartItems, saveCart]);

  const updateQuantity = useCallback(async (id, qty) => {
    if (qty < 1) return;
    const updated = cartItems.map(i => i.id === id ? { ...i, quantity: qty } : i);
    await saveCart(updated);
  }, [cartItems, saveCart]);

  const clearCart = useCallback(async () => {
    if (user) {
      await supabase.from('user_carts').delete().eq('user_id', user.id);
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(LEGACY_GUEST_KEY);
    }
    setCartItems([]);
    window.dispatchEvent(new Event('cartUpdated'));
  }, [user]);

  const refreshCartPrices = useCallback(async () => {
    console.log('🔄 Refreshing cart prices...');
    await loadCart();
  }, [loadCart]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cartItems]);

  // -----------------------------
  // INIT
  // -----------------------------
  useEffect(() => {
    if (rulesLoaded) {
      loadCart();
    }
  }, [rulesLoaded, user]);

  // -----------------------------
  // REALTIME SYNC
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel('cart-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_carts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Each row is one product, not a single blob — easiest to just
          // refetch the whole cart rather than reconstruct it from the payload.
          console.log('🔄 Realtime cart update');
          loadCart();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, loadCart]);

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    loadCart,
    refreshCartPrices,
    getCartCount,
  };
};