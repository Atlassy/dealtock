import React, { useEffect, useState } from 'react';
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { supabase } from '../../lib/supabaseClient';

// Import dashboard components
import AdminDashboard from "./admin/AdminDashboard";
import SellerDashboard from "./seller/SellerDashboard";
import DeliveryDashboard from "./delivery/DeliveryDashboard";

// Import your actual dropshipper dashboard (once created)
import DropshipperDashboard from "./dropshipper/DropshipperDashboard";

const WarehouseDashboard = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-2xl font-bold mb-4">Warehouse Dashboard</h1>
    <p className="text-gray-600">Warehouse dashboard is under construction.</p>
  </div>
);

const DashboardSkeleton = () => (
  <div className="h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading dashboard...</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      console.log('User profile loaded:', data); // Debug log
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading || authLoading) {
    return <DashboardSkeleton />;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Please log in to access the dashboard</p>
      </div>
    );
  }

  // Profile not found - this could happen for new users
  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Profile not found. Please complete your registration.</p>
          <button 
            onClick={fetchUserProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Debug log to see what role is being returned
  console.log('User role:', profile.role);

  // Route based on role - NO DEFAULT FALLBACK TO SELLER
  switch (profile.role?.toLowerCase()) {
    case "admin":
      return <AdminDashboard />;
    case "seller":
      return <SellerDashboard />;
    case "dropshipper":
      return <DropshipperDashboard />;
    case "delivery":
      return <DeliveryDashboard />;
    case "warehouse":
      return <WarehouseDashboard />;
    default:
      // Show error for unknown roles instead of defaulting
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Unknown role: {profile.role || 'undefined'}. Please contact support.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;