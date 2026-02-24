// src/hooks/useMarketplaceProducts.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMarketplaceProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Get current user role
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserRole(profile?.role || 'buyer');
        } else {
          setUserRole('guest');
        }
      } catch (err) {
        console.error('Error getting user role:', err);
        setUserRole('guest');
      }
    };
    getUserRole();
  }, []);

  useEffect(() => {
    if (userRole !== null) {
      fetchProducts();
    }
  }, [JSON.stringify(filters), userRole]);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching products with filters:', filters);
      console.log('User role:', userRole);
      
      // Clean select statement - NO COMMENTS
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          purchase_price,
          image_url,
          quantity,
          condition,
          location,
          user_id,
          created_at
        `)
        .eq('available_for_sale', true)
        .eq('status', 'available')
        .gt('quantity', 0)
        .gt('purchase_price', 0); // Only show products with valid prices

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      // Price filters using purchase_price
      if (filters.minPrice) {
        query = query.gte('purchase_price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('purchase_price', filters.maxPrice);
      }
      
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Add sorting
      const sortField = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      
      if (sortField === 'price_asc') {
        query = query.order('purchase_price', { ascending: true });
      } else if (sortField === 'price_desc') {
        query = query.order('purchase_price', { ascending: false });
      } else {
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
      }

      const { data: productsData, error: productsError } = await query;
      
      if (productsError) throw productsError;

      console.log('Products fetched:', productsData?.length || 0);

      // If we have products, fetch profiles for the unique user_ids
      if (productsData && productsData.length > 0) {
        const userIds = [...new Set(productsData.map(p => p.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, company, city, average_rating')
          .in('id', userIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        }

        // Create a map of profiles by user_id
        const profilesMap = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
        }

        // Merge products with their profiles and calculate display prices based on role
        const productsWithProfiles = productsData.map(product => {
          const basePrice = parseFloat(product.purchase_price) || 0;
          
          // Calculate display price based on user role
          let displayPrice = basePrice;
          let priceLabel = 'B2B Price';
          let marketplaceFee = 0;
          
          if (userRole === 'dropshipper') {
            displayPrice = basePrice;
            priceLabel = 'Your Cost (B2B)';
            marketplaceFee = 0;
          } else if (userRole === 'buyer' || userRole === 'guest') {
            displayPrice = basePrice * 1.20;
            priceLabel = 'Retail Price';
            marketplaceFee = basePrice * 0.20;
          }
          
          return {
            ...product,
            base_price: basePrice,
            display_price: displayPrice,
            price_label: priceLabel,
            marketplace_fee: marketplaceFee,
            formatted_price: new Intl.NumberFormat('fr-MA', {
              style: 'currency',
              currency: 'MAD',
              minimumFractionDigits: 2
            }).format(displayPrice),
            profiles: profilesMap[product.user_id] || {
              full_name: 'Seller',
              company: null,
              city: product.location || 'Unknown',
              average_rating: 0
            }
          };
        });

        setProducts(productsWithProfiles);
      } else {
        setProducts([]);
      }
      
    } catch (err) {
      console.error('Error in fetchProducts:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  // Helper function to refresh products
  const refetch = () => {
    if (userRole !== null) {
      fetchProducts();
    }
  };

  // Helper function to get price based on role
  const getPriceForRole = (product, role = userRole) => {
    const basePrice = parseFloat(product.purchase_price) || 0;
    
    switch (role) {
      case 'dropshipper':
        return {
          price: basePrice,
          formatted: new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD'
          }).format(basePrice),
          label: 'Your Cost (B2B)'
        };
      case 'buyer':
      case 'guest':
      default:
        const retailPrice = basePrice * 1.20;
        return {
          price: retailPrice,
          formatted: new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD'
          }).format(retailPrice),
          label: 'Retail Price',
          marketplace_fee: basePrice * 0.20
        };
    }
  };

  return { 
    products, 
    loading, 
    error, 
    refetch,
    userRole,
    getPriceForRole 
  };
}