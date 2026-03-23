// src/components/dashboard/DashboardRouter.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import SellerDashboard from './seller/SellerDashboard';
import Inventory from './seller/Inventory'; // Import Inventory
import DropshipperDashboard from './dropshipper/DropshipperDashboard';
import AdminDashboard from './admin/AdminDashboard';
import DeliveryDashboard from './delivery/DeliveryDashboard';
import WarehouseDashboard from '../Warehouse/WarehouseDashboard';

const DashboardRouter = () => {
  const { user, profile } = useAuth();

  if (!user) return <Navigate to="/login" />;

  // Role-based routing
  switch (profile?.role) {
    case 'seller':
      return (
        <Routes>
          <Route path="/" element={<SellerDashboard />} />
          {/* ✅ ADD THIS LINE - Inventory route for sellers */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      );
    
    case 'dropshipper':
      return <DropshipperDashboard />;
    
    case 'admin':
      return <AdminDashboard />;
    
    case 'delivery':
      return <DeliveryDashboard />;
    
    case 'warehouse':
      return <WarehouseDashboard />;
    
    default:
      return <Navigate to="/" />;
  }
};

export default DashboardRouter;