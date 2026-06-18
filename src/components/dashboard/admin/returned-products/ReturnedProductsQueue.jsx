// ReturnedProductsQueue.jsx
// Admin review queue — approve or decline returned product listings
// from delivery companies before they go live on the marketplace

import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, Clock, MapPin, Package,
  RefreshCw, Eye, Filter, ChevronDown, Tag,
  AlertCircle, Truck, Calendar, Info
} from "lucide-react";

const DECLINE_REASONS = [
  "Product description insufficient",
  "Price too high for condition",
  "Category mismatch",
  "City/location missing or unclear",
  "Duplicate listing detected",
  "Product not eligible (not sealed/condition A)",
  "Image required before approval",
  "Other (see notes)",
];

const ReturnedProductsQueue = ({ onSwitchToImport }) => {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("pending_review"); // pending_review | available | declined
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotes, setDeclineNotes]   = useState("");
  const [processing, setProcessing]       = useState(null); // product id being processed
  const [searchTerm, setSearchTerm]       = useState("");

  useEffect(() => { fetchProducts(); }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_products")        // uses the admin view (includes all fields)
      .select("*")
      .eq("source_type", "returned")
      .eq("listing_status", filter)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load products: " + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (product) => {
    setProcessing(product.id);
    const { error } = await supabase
      .from("products")
      .update({
        listing_status:     "available",
        available_for_sale: true,
        decline_reason:     null,
      })
      .eq("id", product.id);

    if (error) {
      toast.error("Approval failed: " + error.message);
    } else {
      toast.success(`"${product.name}" approved and live on marketplace!`);
      fetchProducts();
    }
    setProcessing(null);
  };

  const handleDecline = async () => {
    if (!selectedProduct) return;
    if (!declineReason) {
      toast.error("Please select a decline reason");
      return;
    }
    setProcessing(selectedProduct.id);
    const reason = declineNotes
      ? `${declineReason} — ${declineNotes}`
      : declineReason;

    const { error } = await supabase
      .from("products")
      .update({
        listing_status:     "declined",
        available_for_sale: false,
        decline_reason:     reason,
      })
      .eq("id", selectedProduct.id);

    if (error) {
      toast.error("Decline failed: " + error.message);
    } else {
      toast.success(`"${selectedProduct.name}" declined with reason sent to delivery company.`);
      setSelectedProduct(null);
      setDeclineReason("");
      setDeclineNotes("");
      fetchProducts();
    }
    setProcessing(null);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.delivery_company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig = {
    pending_review: { label: "Pending Review", color: "bg-amber-100 text-amber-700", icon: Clock },
    available:      { label: "Approved",        color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
    declined:       { label: "Declined",        color: "bg-red-100 text-red-600",      icon: XCircle },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-kraft-500" />
            Returned Products Queue
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review listings submitted by delivery companies before they go live.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={onSwitchToImport} className="flex items-center gap-1.5 px-3 py-2 bg-kraft-500 hover:bg-kraft-600 text-white rounded-lg text-sm font-medium">
            <Package className="w-4 h-4" /> Import CSV
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product, city, category, or delivery company…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-kraft-400 focus:border-kraft-400"
        />
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
          Loading products…
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No {statusConfig[filter].label.toLowerCase()} listings</p>
          {filter === "pending_review" && (
            <p className="text-sm text-gray-400 mt-1">
              Import a CSV from a delivery company to see listings here.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const StatusIcon = statusConfig[product.listing_status]?.icon || Clock;
            const isProcessing = processing === product.id;

            return (
              <div key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">

                {/* Product image placeholder */}
                <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                  {product.image_url
                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    : <Package className="w-12 h-12 text-gray-300" />
                  }

                  {/* Source badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-kraft-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Package className="w-3 h-3" /> Returned
                  </span>

                  {/* City locked badge */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{product.location || "No city"}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{product.name}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[product.listing_status]?.color}`}>
                      {statusConfig[product.listing_status]?.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                    {product.category && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        <span>{product.category}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3 h-3" />
                      <span>{product.delivery_company_name || "Unknown delivery co."}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>Listed {new Date(product.created_at).toLocaleDateString("fr-MA")}</span>
                    </div>
                    {/* days_in_storage: ADMIN ONLY */}
                    {product.days_in_storage != null && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600 font-medium">
                          {product.days_in_storage} days in storage
                          <span className="text-gray-400 font-normal ml-1">(admin only)</span>
                        </span>
                      </div>
                    )}
                    {product.decline_reason && (
                      <div className="flex items-start gap-1.5 mt-1 p-2 bg-red-50 rounded-lg">
                        <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                        <span className="text-red-600 text-xs">{product.decline_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-xl font-bold text-gray-900">
                        {product.asking_price ? `${Number(product.asking_price).toFixed(2)}` : "—"}
                      </span>
                      <span className="text-sm text-gray-400">MAD</span>
                      <span className="ml-auto text-xs text-gray-400">
                        Condition: <span className="font-semibold text-green-600">A (Sealed)</span>
                      </span>
                    </div>

                    {/* Actions */}
                    {filter === "pending_review" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(product)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          {isProcessing
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />
                          }
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedProduct(product)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    )}

                    {filter === "available" && (
                      <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live on marketplace · city-locked to {product.location}
                      </div>
                    )}

                    {filter === "declined" && (
                      <button
                        onClick={() => handleApprove(product)}
                        className="w-full py-2 border border-green-300 text-green-600 hover:bg-green-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Re-approve listing
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Decline Listing
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                "{selectedProduct.name}"
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for declining *
                </label>
                <div className="relative">
                  <select
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
                  >
                    <option value="">— Select a reason —</option>
                    {DECLINE_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={declineNotes}
                  onChange={e => setDeclineNotes(e.target.value)}
                  rows={3}
                  placeholder="Provide actionable feedback so the delivery company can resubmit correctly…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  The decline reason will be visible to the delivery company in their portal
                  so they can correct and resubmit the listing.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => { setSelectedProduct(null); setDeclineReason(""); setDeclineNotes(""); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason || processing === selectedProduct.id}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {processing === selectedProduct.id
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                Decline listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnedProductsQueue;
