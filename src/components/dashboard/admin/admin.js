const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to all admin routes
router.use(adminLimiter);

// Middleware to verify admin using JWT
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active_delivery')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin' || !profile?.is_active_delivery) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminId = user.id;
    req.adminEmail = user.email;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Apply admin verification to all routes
router.use(verifyAdmin);

// ==================== DELIVERY COMPANY ENDPOINTS ====================

// Get all delivery companies with stats
router.get('/delivery-companies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_delivery_companies_with_stats_admin');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Delivery companies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update delivery company
router.put('/delivery-companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .rpc('admin_update_delivery_company', {
        p_company_id: id,
        p_admin_id: req.adminId,
        ...updates
      });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Regenerate API key
router.post('/delivery-companies/:id/regenerate-key', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .rpc('admin_regenerate_delivery_api_key', {
        p_company_id: id,
        p_admin_id: req.adminId
      });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Regenerate key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ORDER MANAGEMENT ENDPOINTS ====================

// Get orders with filters
router.get('/orders', async (req, res) => {
  try {
    const { 
      status, 
      delivery_company_id, 
      seller_id, 
      date_from, 
      date_to, 
      search,
      limit = 50,
      offset = 0 
    } = req.query;

    const { data, error } = await supabase
      .rpc('admin_get_orders', {
        p_admin_id: req.adminId,
        p_status: status || null,
        p_delivery_company_id: delivery_company_id || null,
        p_seller_id: seller_id || null,
        p_date_from: date_from || null,
        p_date_to: date_to || null,
        p_search: search || null,
        p_limit: parseInt(limit),
        p_offset: parseInt(offset)
      });

    if (error) throw error;
    
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    res.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single order details
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with all related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        product:products(*),
        seller:profiles!orders_seller_id_fkey(full_name, email, phone),
        dropshipper:profiles!orders_dropshipper_id_fkey(full_name, email),
        delivery_company:delivery_companies(*),
        status_history:order_status_history(*),
        escrow:escrow_holdings(*),
        settlements(*),
        order_events(*)
      `)
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    // Get financials if exists
    const { data: financials } = await supabase
      .from('order_financials')
      .select('*')
      .eq('order_id', id)
      .single()
      .then(({ data }) => ({ data }))
      .catch(() => ({ data: null }));

    res.json({
      success: true,
      data: {
        ...order,
        financials
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Override order status
router.post('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status and reason are required' 
      });
    }

    const { data, error } = await supabase
      .rpc('admin_override_order_status', {
        p_order_id: id,
        p_new_status: status,
        p_admin_id: req.adminId,
        p_reason: reason
      });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Override status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ESCROW MANAGEMENT ENDPOINTS ====================

// Get pending escrow
router.get('/escrow/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_get_pending_escrow');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Pending escrow error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Release escrow for single order
router.post('/escrow/:order_id/release', async (req, res) => {
  try {
    const { order_id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .rpc('admin_release_escrow', {
        p_order_id: order_id,
        p_admin_id: req.adminId,
        p_release_reason: reason || 'manual_release'
      });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk release eligible escrow
router.post('/escrow/bulk-release', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_bulk_release_eligible_escrow', {
        p_admin_id: req.adminId
      });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Bulk release error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

// Get dashboard metrics
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const { data, error } = await supabase
      .rpc('admin_get_dashboard_metrics', {
        p_date_range_days: parseInt(days)
      });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent admin activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('admin_actions')
      .select(`
        *,
        admin:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      admin: req.adminEmail,
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

module.exports = router;