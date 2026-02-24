// src/components/dashboard/warehouse/WarehouseDashboard.jsx
import React from "react";
import { useAuth } from "../../../contexts/SupabaseAuthContext";

const WarehouseDashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Warehouse Dashboard</h1>
      <p className="text-gray-600">Welcome, {user?.email}</p>
      <p className="text-gray-600 mt-4">Warehouse management features coming soon...</p>
    </div>
  );
};

export default WarehouseDashboard;