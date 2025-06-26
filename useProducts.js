import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const commissionRate = 0.1; // 10% commission

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    
    let query = supabase.from('products').select('*');

    // If not admin, only fetch user's products
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email !== 'allblue.contact@gmail.com') {
      query = query.eq('user_id', user.id);
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } else {
      setProducts(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('realtime products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const addProduct = async (newProductData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    if (!newProductData.name || !newProductData.category || !newProductData.value || !newProductData.location || !newProductData.description || !newProductData.quantity) {
      throw new Error("All fields are required");
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...newProductData,
        user_id: user.id,
        status: 'pending_approval',
        entry_date: new Date().toISOString().split('T')[0],
        value: parseFloat(newProductData.value),
        quantity: parseInt(newProductData.quantity, 10),
        image: `https://source.unsplash.com/400x300/?${newProductData.category},product`,
      }]);

    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }
    return data;
  };

  const updateProductStatus = async (productId, newStatus, details = {}) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedProductData = { status: newStatus, ...details };

    if (newStatus === 'sold') {
      updatedProductData.sale_date = new Date().toISOString().split('T')[0];
      if (details.salePrice) {
        updatedProductData.commission = parseFloat(details.salePrice) * commissionRate;
        updatedProductData.net_amount = parseFloat(details.salePrice) - updatedProductData.commission;
      }
    }

    if (newStatus === 'shipped') {
      updatedProductData.shipping_date = new Date().toISOString().split('T')[0];
    }

    if (newStatus === 'available') {
      updatedProductData.sale_date = null;
      updatedProductData.sale_price = null;
      updatedProductData.commission = null;
      updatedProductData.net_amount = null;
      updatedProductData.shipping_date = null;
      updatedProductData.carrier = null;
      updatedProductData.tracking_link = null;
      updatedProductData.delivery_proof = null;
    }

    const { error } = await supabase
      .from('products')
      .update(updatedProductData)
      .eq('id', productId);

    if (error) {
      console.error('Error updating product status:', error);
      throw error;
    }
  };

  const getStats = () => {
    const availableCount = products.filter(p => ['available', 'pending_approval'].includes(p.status)).length;
    const soldCount = products.filter(p => p.status === 'sold').length;
    const shippedCount = products.filter(p => p.status === 'shipped').length;
    
    const totalValue = products.filter(p => ['available', 'pending_approval'].includes(p.status)).reduce((total, product) => total + (product.value || 0) * (product.quantity || 1), 0);
    const totalSoldAmount = products.filter(p => p.status === 'sold' && p.sale_price).reduce((sum, p) => sum + p.sale_price, 0);
    const totalCommission = products.filter(p => p.status === 'sold' && p.commission).reduce((sum, p) => sum + p.commission, 0);
    const totalNetToReceive = products.filter(p => p.status === 'sold' && p.net_amount).reduce((sum, p) => sum + p.net_amount, 0);

    return {
      available: availableCount,
      sold: soldCount,
      shipped: shippedCount,
      total: products.length,
      totalValue,
      totalSoldAmount,
      totalCommission,
      totalNetToReceive
    };
  };

  return {
    products,
    isLoading,
    addProduct,
    updateProductStatus,
    getStats
  };
}