import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProducts(userId) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    sold: 0,
    shipped: 0,
    totalValue: 0,
    totalSoldAmount: 0,
    totalCommission: 0,
    totalNetToReceive: 0
  });

  useEffect(() => {
    if (userId) {
      loadProducts();
      
      // Subscribe to real-time changes
      const channel = supabase
        .channel('products-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'products',
            filter: `user_id=eq.${userId}`
          }, 
          () => loadProducts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const loadProducts = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);

      // Calculate statistics
      const total = data?.length || 0;
      const available = data?.filter(p => p.status === 'available').length || 0;
      const sold = data?.filter(p => p.status === 'sold').length || 0;
      const shipped = data?.filter(p => p.status === 'shipped').length || 0;
      const totalValue = data?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
      const totalSoldAmount = data
        ?.filter(p => p.status === 'sold' || p.status === 'shipped')
        .reduce((sum, p) => sum + (p.sale_price || 0), 0) || 0;
      const totalCommission = data
        ?.filter(p => p.status === 'sold' || p.status === 'shipped')
        .reduce((sum, p) => sum + (p.commission || 0), 0) || 0;
      const totalNetToReceive = data
        ?.filter(p => p.status === 'sold' || p.status === 'shipped')
        .reduce((sum, p) => sum + (p.net_amount || 0), 0) || 0;

      setStats({
        total,
        available,
        sold,
        shipped,
        totalValue,
        totalSoldAmount,
        totalCommission,
        totalNetToReceive
      });
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock data for development
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data fallback
  const loadMockData = () => {
    const mockProducts = [
      {
        id: '1',
        name: "iPhone 14 Pro",
        category: "Electronics",
        status: "available",
        value: 1200,
        location: "Casablanca Warehouse",
        entry_date: "2024-01-15T00:00:00Z",
        description: "Latest iPhone model"
      },
      {
        id: '2',
        name: "MacBook Air M2",
        category: "Electronics",
        status: "sold",
        value: 1500,
        sale_price: 1450,
        commission: 145,
        net_amount: 1305,
        location: "Rabat Store",
        entry_date: "2024-01-10T00:00:00Z",
        sale_date: "2024-01-20T00:00:00Z"
      },
      {
        id: '3',
        name: "Designer Handbag",
        category: "Fashion",
        status: "shipped",
        value: 800,
        sale_price: 780,
        commission: 78,
        net_amount: 702,
        location: "Marrakech Boutique",
        entry_date: "2024-01-05T00:00:00Z",
        sale_date: "2024-01-18T00:00:00Z",
        shipping_date: "2024-01-22T00:00:00Z",
        carrier: "DHL",
        tracking_link: "https://track.dhl.com/123456"
      }
    ];

    setProducts(mockProducts);
    
    const total = mockProducts.length;
    const available = mockProducts.filter(p => p.status === 'available').length;
    const sold = mockProducts.filter(p => p.status === 'sold').length;
    const shipped = mockProducts.filter(p => p.status === 'shipped').length;
    const totalValue = mockProducts.reduce((sum, p) => sum + p.value, 0);
    const totalSoldAmount = mockProducts
      .filter(p => p.status === 'sold' || p.status === 'shipped')
      .reduce((sum, p) => sum + (p.sale_price || 0), 0);
    const totalCommission = mockProducts
      .filter(p => p.status === 'sold' || p.status === 'shipped')
      .reduce((sum, p) => sum + (p.commission || 0), 0);
    const totalNetToReceive = mockProducts
      .filter(p => p.status === 'sold' || p.status === 'shipped')
      .reduce((sum, p) => sum + (p.net_amount || 0), 0);

    setStats({
      total,
      available,
      sold,
      shipped,
      totalValue,
      totalSoldAmount,
      totalCommission,
      totalNetToReceive
    });
  };

  const updateProductStatus = async (productId, newStatus, details = {}) => {
    try {
      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add additional details based on status
      if (newStatus === 'sold') {
        updates.sale_price = details.salePrice;
        updates.sale_date = new Date().toISOString();
      } else if (newStatus === 'shipped') {
        updates.shipping_date = new Date().toISOString();
        updates.carrier = details.carrier;
        updates.tracking_link = details.trackingLink;
        updates.delivery_proof = details.deliveryProof;
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', userId);

      if (error) throw error;

      // Reload products to get updated data
      await loadProducts();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, error };
    }
  };

  const addProduct = async (productData) => {
    try {
      const product = {
        ...productData,
        user_id: userId,
        entry_date: new Date().toISOString(),
        status: 'available'
      };

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      await loadProducts();
      return { success: true, product: data };
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, error };
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadProducts();
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, error };
    }
  };

  const getStats = () => stats;

  return {
    products,
    isLoading,
    updateProductStatus,
    addProduct,
    deleteProduct,
    getStats,
    refreshProducts: loadProducts
  };
}