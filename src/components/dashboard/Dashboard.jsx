// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";
import { Package, TrendingUp, Percent, Euro } from "lucide-react";
import { toast } from "sonner";
import DashboardHeader from "./DashboardHeader";
import SellerDashboard from "./seller/SellerDashboard";
import DropshipperDashboard from "./dropshipper/DropshipperDashboard";
import DeliveryDashboard from "./delivery/DeliveryDashboard";
import WarehouseDashboard from "./warehouse/WarehouseDashboard";
import AdminDashboard from "./admin/AdminDashboard";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      console.log('User profile loaded:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg p-8 rounded-2xl">
          <Package className="w-20 h-20 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Please Log In</h2>
          <p className="text-gray-300">You need to be authenticated to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg p-8 rounded-2xl">
          <Package className="w-20 h-20 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-300">Please contact support.</p>
        </div>
      </div>
    );
  }

  console.log('User role:', profile.role);

  // Route to appropriate dashboard based on role
  switch (profile.role) {
    case "seller":
      return <SellerDashboard />;
    case "dropshipper":
      return <DropshipperDashboard />;
    case "delivery":
      return <DeliveryDashboard />;
    case "warehouse":
      return <WarehouseDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
          <div className="text-center bg-white/10 backdrop-blur-lg p-8 rounded-2xl">
            <Package className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unauthorized Role</h2>
            <p className="text-gray-300">Your account role '{profile.role}' is not recognized.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;