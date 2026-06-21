// src/components/dashboard/Warehouse/WarehouseDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/SupabaseAuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { Package, MapPin, Clock, DollarSign, RefreshCw, CheckCircle2, Tag } from "lucide-react";
import { toast } from "sonner";

const daysInStorage = (createdAt) =>
  Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));

const WarehouseDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending_review | available | declined | sold
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState("");

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .eq("source_type", "returned")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((p) => {
    if (filter === "all") return true;
    if (filter === "sold") return p.status === "sold";
    return p.listing_status === filter && p.status !== "sold";
  });

  const stats = {
    total: products.length,
    pendingReview: products.filter((p) => p.listing_status === "pending_review").length,
    available: products.filter((p) => p.listing_status === "available" && p.status !== "sold").length,
    sold: products.filter((p) => p.status === "sold").length,
    totalValue: products
      .filter((p) => p.status !== "sold")
      .reduce((sum, p) => sum + (Number(p.asking_price) || 0), 0),
  };

  const handleMarkSold = async (product) => {
    if (!window.confirm(`Mark "${product.name}" as sold?`)) return;
    const { error } = await supabase
      .from("products")
      .update({ status: "sold", available_for_sale: false })
      .eq("id", product.id);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success(`"${product.name}" marked as sold`);
      fetchProducts();
    }
  };

  const handleSavePrice = async (product) => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({ asking_price: price })
      .eq("id", product.id);

    if (error) {
      toast.error("Failed to update price: " + error.message);
    } else {
      toast.success("Price updated");
      setEditingPrice(null);
      fetchProducts();
    }
  };

  const statusConfig = {
    pending_review: { label: "Pending Review", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
    available: { label: "Available", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    declined: { label: "Declined", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-kraft-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouse Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage returned products assigned to you, {user?.email}
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingReview}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Available for Sale</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalValue.toFixed(2)} MAD</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          ["all", "All"],
          ["pending_review", "Pending Review"],
          ["available", "Available"],
          ["declined", "Declined"],
          ["sold", "Sold"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === key
                ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No products in this view</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Returned products assigned to you by the admin will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isSold = product.status === "sold";
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
              >
                <div className="h-32 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    {isSold ? (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        Sold
                      </span>
                    ) : (
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[product.listing_status]?.color || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                        {statusConfig[product.listing_status]?.label || product.listing_status || "Unknown"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {product.category && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" /> {product.category}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {product.location || "No location set"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {daysInStorage(product.created_at)} days in storage
                    </div>
                    {product.decline_reason && (
                      <div className="text-red-500 dark:text-red-400">{product.decline_reason}</div>
                    )}
                  </div>

                  <div className="mt-auto">
                    {editingPrice === product.id ? (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          autoFocus
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => handleSavePrice(product)}
                          className="px-2 py-1 bg-kraft-500 text-white rounded text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {product.asking_price ? Number(product.asking_price).toFixed(2) : "—"}
                        </span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">MAD</span>
                        {!isSold && (
                          <button
                            onClick={() => {
                              setEditingPrice(product.id);
                              setPriceInput(product.asking_price || "");
                            }}
                            className="ml-auto text-xs text-kraft-600 dark:text-kraft-400 hover:underline flex items-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" /> Edit price
                          </button>
                        )}
                      </div>
                    )}

                    {!isSold && product.listing_status === "available" && (
                      <button
                        onClick={() => handleMarkSold(product)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Sold
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WarehouseDashboard;
