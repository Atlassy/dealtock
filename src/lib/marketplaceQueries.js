// src/lib/marketplaceQueries.js - FIXED VERSION
import { supabase } from './supabaseClient';

export const marketplaceQueries = {
  // Get all available products with seller info
  async getAvailableProducts(filters = {}) {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        sale_price,
        image_url,
        quantity,
        condition,
        user_id,
        profiles!products_user_id_fkey (
          id,
          full_name,
          company,
          city,
          average_rating,
          phone
        )
      `)
      .eq('status', 'available')
      .eq('available_for_sale', true)
      .gt('quantity', 0);

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.minPrice) {
      query = query.gte('sale_price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('sale_price', filters.maxPrice);
    }
    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Sorting
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  },

  // Get single product with full details
  async getProductDetails(productId) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_user_id_fkey (
          full_name,
          company,
          email,
          phone,
          city,
          average_rating
        )
      `)
      .eq('id', productId)
      .single();

    if (error) throw error;
    return { data, error: null };
  },

  // Calculate shipping options for a product
  async calculateShippingOptions(productId, destinationCity, weight) {
    // First get the product to ensure we have weight
    const { data: product } = await supabase
      .from('products')
      .select('weight_kg, sale_price')
      .eq('id', productId)
      .single();

    const productWeight = weight || product?.weight_kg || 1;

    // Get active delivery companies with fee rules for this route
    const { data, error } = await supabase
      .from('delivery_companies')
      .select(`
        id,
        name,
        service_type,
        base_fee_multiplier,
        cod_fee,
        average_rating,
        delivery_fee_rules!inner (
          id,
          base_fee,
          cod_fee,
          per_kg_fee,
          estimated_days,
          max_weight
        )
      `)
      .eq('is_active', true)
      .eq('delivery_fee_rules.is_active', true)
      .eq('delivery_fee_rules.to_city', destinationCity)
      .gte('delivery_fee_rules.max_weight', productWeight);

    if (error) throw error;
    return { data, error: null };
  },

  // Create a new order
  async createOrder(orderData) {
    try {
      console.log('📦 Creating order with data:', orderData);
      
      // Prepare the insert data WITHOUT manual order_number
      const insertData = {
        product_id: orderData.productId,
        seller_id: orderData.sellerId,
        dropshipper_id: orderData.dropshipperId || null,
        delivery_company_id: orderData.deliveryCompanyId,
        status: 'ordered',
        product_price: orderData.productPrice,
        dropshipper_markup: orderData.dropshipperMarkup || 0,
        final_customer_price: orderData.finalPrice,
        shipping_fee: orderData.shippingFee,
        shipping_city: orderData.shippingCity,
        ordered_quantity: orderData.quantity,
        payment_method: 'COD',
        is_cod: true,
        cod_collection_status: 'pending',
        shipping_address: orderData.shippingAddress,
        delivery_weight_kg: orderData.weight,
        delivery_service_type: orderData.serviceType
        // ⚠️ IMPORTANT: Do NOT include order_number here
        // The database trigger will generate it automatically
      };

      console.log('📦 Insert payload:', insertData);

      const { data: order, error } = await supabase
        .from('orders')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Order insert error:', error);
        throw error;
      }

      console.log('✅ Order created with number:', order.order_number);

      // Update product quantity
      if (orderData.product && orderData.product.quantity) {
        const newQuantity = orderData.product.quantity - orderData.quantity;
        console.log(`📦 Updating product ${orderData.productId} quantity from ${orderData.product.quantity} to ${newQuantity}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', orderData.productId);

        if (updateError) {
          console.error('❌ Product quantity update error:', updateError);
          // Don't throw - order is already created
        }
      }

      return order;

    } catch (error) {
      console.error('❌ Create order error:', error);
      throw error;
    }
  },

  // Get all categories (for filter)
  async getCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'available')
      .not('category', 'is', null);

    if (error) throw error;
    
    // Extract unique categories
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    return { data: categories, error: null };
  }
};