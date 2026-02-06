import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, TrendingUp, Percent, Coins, Filter } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/SupabaseAuthContext";

import ProductTable from "./ProductTable";
import AddProductForm from "./AddProductForm";
import EditProductForm from "./EditProductForm";
import DashboardSkeleton from "./DashboardSkeleton";

const SellerDashboard = () => {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalCommission: 0,
    averageCommissionRate: 0
  });

  /* -----------------------------
     Fetch products (SAFE QUERY)
  ------------------------------*/
  const fetchProducts = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        status,
        quantity,
        sale_price,
        commission,
        created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
      setLoading(false);
      return;
    }

    setProducts(data || []);
    calculateStats(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProducts();
    }
  }, [authLoading, user, fetchProducts]);

  /* -----------------------------
     Stats calculation
  ------------------------------*/
  const calculateStats = (allProducts) => {
    const soldProducts = allProducts.filter(p => p.status === "sold");

    const totalSales = soldProducts.reduce(
      (sum, p) => sum + (p.sale_price || 0),
      0
    );

    const totalCommission = soldProducts.reduce(
      (sum, p) => sum + (p.commission || 0),
      0
    );

    setStats({
      totalProducts: allProducts.length,
      totalSales,
      totalCommission,
      averageCommissionRate:
        totalSales > 0
          ? ((totalCommission / totalSales) * 100).toFixed(1)
          : 0
    });
  };

  /* -----------------------------
     CRUD handlers
  ------------------------------*/
  const handleAddProduct = async (productData) => {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          ...productData,
          user_id: user.id,
          status: productData.status || "available"
        }
      ])
      .select(`
        id,
        name,
        status,
        quantity,
        sale_price,
        commission,
        created_at
      `)
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    const updated = [data, ...products];
    setProducts(updated);
    calculateStats(updated);
    setShowAddForm(false);
    toast.success("Product added");
  };

  const handleUpdateProduct = async (id, updates) => {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select(`
        id,
        name,
        status,
        quantity,
        sale_price,
        commission,
        created_at
      `)
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    const updated = products.map(p => (p.id === id ? data : p));
    setProducts(updated);
    calculateStats(updated);
    setEditingProduct(null);
    toast.success("Product updated");
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Archive this product?")) return;

    const { error } = await supabase
      .from("products")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    calculateStats(updated);
    toast.success("Product archived");
  };

  /* -----------------------------
     Render guards
  ------------------------------*/
  if (authLoading || loading) return <DashboardSkeleton />;
  if (!user) return <div className="p-8 text-center">Please log in</div>;

  const filteredProducts =
    selectedStatus === "all"
      ? products
      : products.filter(p => p.status === selectedStatus);

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Stat label="Total Products" value={stats.totalProducts} icon={Package} />
        <Stat label="Total Sales" value={`${stats.totalSales} MAD`} icon={TrendingUp} />
        <Stat label="Commission" value={`${stats.totalCommission} MAD`} icon={Coins} />
        <Stat label="Avg Commission" value={`${stats.averageCommissionRate}%`} icon={Percent} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4">
        <Filter />
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-slate-800 p-2 rounded"
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      {/* Products */}
      <ProductTable
        products={filteredProducts}
        onEdit={setEditingProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Modals */}
      {showAddForm && (
        <AddProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onSubmit={updates => handleUpdateProduct(editingProduct.id, updates)}
          onCancel={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};

/* -----------------------------
   Small stat component
------------------------------*/
const Stat = ({ label, value, icon: Icon }) => (
  <div className="bg-slate-800 rounded-xl p-5 flex justify-between items-center">
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    <Icon className="w-8 h-8 text-purple-400" />
  </div>
);

export default SellerDashboard;
