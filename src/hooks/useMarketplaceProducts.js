// src/hooks/useMarketplaceProducts.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const useMarketplaceProducts = (filters) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [commissionRates, setCommissionRates] = useState({});
  const { user } = useAuth();

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setUserRole(data.role);
        }
      } else {
        setUserRole('b2c');
      }
    };
    
    fetchUserRole();
  }, [user]);

  // Fetch commission rates
  useEffect(() => {
    const fetchCommissionRates = async () => {
      if (!userRole) return;
      
      try {
        let appliesTo = 'B2C';
        if (userRole === 'dropshipper') {
          appliesTo = 'dropshipper';
        } else if (userRole === 'seller') {
          appliesTo = 'Seller';
        }
        
        const { data, error } = await supabase
          .from('commission_rules')
          .select('category, percentage, min_amount, max_amount')
          .eq('applies_to', appliesTo)
          .eq('is_active', true);
        
        if (!error && data) {
          const rates = {};
          data.forEach(rule => {
            const category = rule.category || 'default';
            if (!rates[category]) {
              rates[category] = [];
            }
            rates[category].push({
              percentage: rule.percentage,
              min_amount: rule.min_amount,
              max_amount: rule.max_amount
            });
          });
          setCommissionRates(rates);
        }
      } catch (err) {
        console.error('Error fetching commission rates:', err);
      }
    };
    
    fetchCommissionRates();
  }, [userRole]);

  // Get commission rate for a product
  const getCommissionRate = useCallback((product) => {
    const basePrice = product.purchase_price || 0;
    const category = product.category || 'Other';
    
    const categoryRules = commissionRates[category] || commissionRates['default'] || [];
    
    let rate = 0;
    for (const rule of categoryRules) {
      const minOk = rule.min_amount === null || basePrice >= rule.min_amount;
      const maxOk = rule.max_amount === null || basePrice <= rule.max_amount;
      
      if (minOk && maxOk) {
        rate = rule.percentage;
        break;
      }
    }
    
    // Fallback logic
    if (rate === 0 && userRole !== 'dropshipper' && userRole !== 'seller') {
      if (basePrice >= 5000) rate = 10;
      else if (basePrice >= 1000) rate = 20;
      else rate = 30;
    }
    
    return rate;
  }, [commissionRates, userRole]);

  // Get price for user role
  const getPriceForRole = useCallback((product) => {
    const basePrice = product.purchase_price || 0;
    
    if (userRole === 'dropshipper' || userRole === 'seller') {
      return {
        price: basePrice,
        label: userRole === 'dropshipper' ? 'Wholesale Price' : 'Your Price',
        marketplace_fee: 0,
        commission_rate: 0,
        invalid: false
      };
    }
    
    const commissionRate = getCommissionRate(product);
    const finalPrice = basePrice * (1 + commissionRate / 100);
    
    return {
      price: finalPrice,
      label: 'Price',
      marketplace_fee: finalPrice - basePrice,
      commission_rate: commissionRate,
      invalid: false
    };
  }, [userRole, getCommissionRate]);

  // 🔧 FIXED: Fetch products with all filters applied
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          purchase_price,
          quantity,
          condition,
          status,
          image_url,
          location,
          created_at,
          user_id,
          profiles!user_id (
            id,
            email,
            full_name,
            company,
            role
          )
        `)
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0)
        .gt('purchase_price', 0);

      // 🔧 Apply search filter
      if (filters.search && filters.search !== '') {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      // 🔧 Apply category filter
      if (filters.category && filters.category !== '') {
        query = query.eq('category', filters.category);
      }
      
      // 🔧 Apply location/city filter
      if (filters.location && filters.location !== '') {
        query = query.eq('location', filters.location);
      }
      
      // 🔧 Apply condition filter
      if (filters.condition && filters.condition !== '') {
        query = query.eq('condition', filters.condition);
      }
      
      // 🔧 Apply price range filters
      if (filters.minPrice && filters.minPrice !== '') {
        query = query.gte('purchase_price', parseFloat(filters.minPrice));
      }
      if (filters.maxPrice && filters.maxPrice !== '') {
        query = query.lte('purchase_price', parseFloat(filters.maxPrice));
      }

      // 🔧 Apply sorting
      if (filters.sortBy === 'price_low') {
        query = query.order('purchase_price', { ascending: true });
      } else if (filters.sortBy === 'price_high') {
        query = query.order('purchase_price', { ascending: false });
      } else if (filters.sortBy === 'name') {
        query = query.order('name', { ascending: true });
      } else if (filters.sortBy === 'rating') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log('Products fetched with filters:', filters, 'Count:', data?.length);
      setProducts(data || []);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    userRole,
    getPriceForRole,
    refetch: fetchProducts
  };
};