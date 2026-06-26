// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import { supabase } from "../../lib/supabaseClient";
import { motion } from "framer-motion";
import AdminDashboard from "./admin/AdminDashboard";
import SellerDashboard from "./seller/SellerDashboard";
import DropshipperDashboard from "./dropshipper/DropshipperDashboard";
import DeliveryDashboard from "./delivery/DeliveryDashboard";
import WarehouseDashboard from "./Warehouse/WarehouseDashboard";
import DashboardSkeleton from "./DashboardSkeleton";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !profile) {
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
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Please log in to access the dashboard</p>
      </div>
    );
  }

  // Role-based dashboard rendering
  switch (profile?.role) {
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
      // Plain customer accounts (role is empty by default) have no
      // dashboard of their own — send them to the marketplace instead.
      return <Navigate to="/" replace />;
  }
};

export default Dashboard;