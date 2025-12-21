
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!user || !user.profile) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    
    let query = supabase.from('products').select('*');
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message);
      setProducts([]);
    } else {
      setProducts(data);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if(user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  const addProduct = async (newProductData) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        ...newProductData,
        seller_id: user.id,
        status: 'pending_approval' 
      }])
      .select();

    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }

    if (data) {
      await fetchProducts(); // Refresh list
    }
    return data;
  };

  const updateProduct = async (productId, updatedData) => {
    const { data, error } = await supabase
      .from('products')
      .update(updatedData)
      .eq('id', productId)
      .select();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
    
    if (data) {
       await fetchProducts(); // Refresh list
    }
    return data;
  };
  
  const updateProductStatus = async (productId, newStatus, details = {}) => {
    const updatedProductData = { status: newStatus, ...details };
    await updateProduct(productId, updatedProductData);
  };

  return {
    products,
    isLoading,
    addProduct,
    updateProduct,
    updateProductStatus,
    refreshProducts: fetchProducts,
  };
}
