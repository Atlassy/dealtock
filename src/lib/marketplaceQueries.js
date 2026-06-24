// src/lib/marketplaceQueries.js
import { supabase } from './supabaseClient';

export const marketplaceQueries = {
  getProducts: async (filters = {}) => {
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

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.minPrice) {
        query = query.gte('purchase_price', parseFloat(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('purchase_price', parseFloat(filters.maxPrice));
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters.sortBy === 'price_asc') {
        query = query.order('purchase_price', { ascending: true });
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('purchase_price', { ascending: false });
      } else if (filters.sortBy === 'name') {
        query = query.order('name', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { data: [], error: error.message };
    }
  },

  // Helper function to generate unique order number within 20 chars
  generateOrderNumber: () => {
    const date = new Date();
    // Format: ORD + YYMMDD + HHMMSS + 2-digit random (max 17 chars)
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    // Max length: "ORD" + "YYMMDDHHMMSS" + "RR" = 3 + 12 + 2 = 17 chars
    return `ORD${year}${month}${day}${hour}${minute}${second}${random}`;
  },

  createOrder: async (orderData) => {
    try {
      console.log('📦 Creating order with data:', orderData);
      
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const isAuthenticated = !!userId;
      const isDropshipper = isAuthenticated && orderData.dropshipperId === userId;
      
      // Validate product price is > 0
      const productPrice = orderData.productPrice || 0;
      if (productPrice <= 0) {
        throw new Error('Cannot place order for product with invalid price');
      }
      
      // Prepare shipping address
      const shippingAddress = {
        name: orderData.shippingAddress?.name || '',
        phone: orderData.shippingAddress?.phone || '',
        address: orderData.shippingAddress?.address || '',
        city: orderData.shippingCity
      };
      
      if (isDropshipper) {
        // Dropshipper order - use RPC function
        console.log('📦 Creating dropshipper order');
        
        const markup = orderData.dropshipperMarkup || 0;
        const category = orderData.product?.category || 'Other';
        
        let commissionRate = 20;
        try {
          // "is_default" rules have category = null but are still tiered by
          // price range (one row per tier), so they can't be fetched with
          // maybeSingle() — fetch every active rule and match by price range.
          const { data: rules } = await supabase
            .from('commission_rules')
            .select('percentage, category, min_amount, max_amount, is_default')
            .eq('applies_to', 'dropshipper')
            .eq('is_active', true);

          const inRange = (r) =>
            (r.min_amount == null || markup >= r.min_amount) &&
            (r.max_amount == null || markup <= r.max_amount);

          const matchedRule =
            (rules || []).find(r => !r.is_default && r.category === category && inRange(r)) ||
            (rules || []).find(r => r.is_default && inRange(r));

          if (matchedRule) {
            commissionRate = matchedRule.percentage;
          }
        } catch (err) {
          console.warn('Error fetching commission rate:', err);
        }
        
        const commissionAmount = markup * (commissionRate / 100);
        const netProfit = markup - commissionAmount;
        
        const { data, error } = await supabase.rpc('place_dropshipper_order_v2', {
          p_product_id: orderData.productId,
          p_quantity: orderData.quantity,
          p_dropshipper_id: userId,
          p_markup: markup,
          p_shipping_fee: orderData.shippingFee || 30,
          p_shipping_address: shippingAddress,
          p_shipping_city: orderData.shippingCity,
          p_commission_rate: commissionRate,
          p_commission_amount: commissionAmount,
          p_net_profit: netProfit,
          p_customer_id: null,
          p_delivery_company_id: orderData.deliveryCompanyId
        });
        
        if (error) throw error;
        return data;
        
      } else {
        // B2C order - Use direct insert to control order number format
        console.log('📦 Creating B2C order', isAuthenticated ? '(authenticated)' : '(anonymous)');
        
        const orderNumber = marketplaceQueries.generateOrderNumber();
        
        const orderInsert = {
          product_id: orderData.productId,
          seller_id: orderData.sellerId,
          customer_id: userId,
          ordered_quantity: orderData.quantity,
          shipping_address: shippingAddress,
          shipping_city: orderData.shippingCity,
          shipping_fee: orderData.shippingFee || 30,
          product_price: orderData.productPrice,
          final_customer_price: orderData.finalPrice,
          status: 'ordered',
          payment_status: 'pending',
          order_type: 'b2c',
          order_number: orderNumber,
          payment_method: 'COD',
          delivery_company_id: orderData.deliveryCompanyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        if (!isAuthenticated) {
          orderInsert.anonymous_session_id = `anon_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substr(2, 4)}`;
          orderInsert.customer_email = orderData.shippingAddress?.email || null;
        }
        
        const { data: order, error } = await supabase
          .from('orders')
          .insert([orderInsert])
          .select()
          .single();
        
        if (error) {
          console.error('❌ B2C order insert error:', error);
          throw error;
        }
        
        console.log('✅ Order created:', order);
        return { 
          success: true, 
          order_id: order.id, 
          order_number: orderNumber,
          is_anonymous: !isAuthenticated
        };
      }
      
    } catch (error) {
      console.error('❌ Create order error:', error);
      throw error;
    }
  },

  // Get order details
  getOrderDetails: async (orderId, userId) => {
    try {
      const { data, error } = await supabase.rpc('get_order_details', {
        p_order_id: orderId,
        p_user_id: userId
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Get seller orders
  getSellerOrders: async (sellerId, limit = 50, offset = 0, statusFilter = null) => {
    try {
      const { data, error } = await supabase.rpc('get_seller_orders', {
        p_seller_id: sellerId,
        p_limit: limit,
        p_offset: offset,
        p_status_filter: statusFilter
      });
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Get dropshipper orders
  getDropshipperOrders: async (dropshipperId, status = null) => {
    try {
      const { data, error } = await supabase.rpc('get_dropshipper_orders', {
        p_dropshipper_id: dropshipperId,
        p_status: status
      });
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Confirm order
  confirmOrder: async (orderId, sellerId) => {
    try {
      const { data, error } = await supabase.rpc('confirm_order', {
        p_order_id: orderId,
        p_seller_id: sellerId
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Cancel order
  cancelOrder: async (orderId, userId, reason = null) => {
    try {
      const { data, error } = await supabase.rpc('cancel_order', {
        p_order_id: orderId,
        p_user_id: userId,
        p_reason: reason
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, newStatus, reason = null) => {
    try {
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_reason: reason
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Ship order
  shipOrder: async (orderId, sellerId) => {
    try {
      const { data, error } = await supabase.rpc('ship_order', {
        p_order_id: orderId,
        p_seller_id: sellerId
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default marketplaceQueries;