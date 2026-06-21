// src/components/MyOrders.jsx
// Order history for a logged-in customer — reached from the navbar
// notification bell ("your order status changed") and from the profile menu.
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { supabase } from "../lib/supabaseClient";
import { Package, Clock, CheckCircle, Truck, AlertCircle, MapPin } from "lucide-react";

const STATUS_BADGES = {
  ordered: { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400", icon: Clock, label: "Pending Approval" },
  approved: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400", icon: CheckCircle, label: "Approved" },
  ready: { color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400", icon: Package, label: "Ready for Pickup" },
  ready_for_pickup: { color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400", icon: Package, label: "Ready for Pickup" },
  picked_up: { color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400", icon: Truck, label: "Picked Up" },
  with_delivery_partner: { color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400", icon: Truck, label: "With Delivery Partner" },
  in_transit: { color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400", icon: Truck, label: "In Transit" },
  out_for_delivery: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400", icon: Truck, label: "Out for Delivery" },
  delivered: { color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400", icon: CheckCircle, label: "Delivered" },
  cancelled: { color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300", icon: AlertCircle, label: "Cancelled" },
  returned: { color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400", icon: AlertCircle, label: "Returned" },
  failed: { color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400", icon: AlertCircle, label: "Delivery Failed" },
  refunded: { color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300", icon: AlertCircle, label: "Refunded" },
};

const StatusBadge = ({ status }) => {
  const badge = STATUS_BADGES[status] || { color: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300", icon: AlertCircle, label: status || "Unknown" };
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      <Icon className="w-3 h-3" /> {badge.label}
    </span>
  );
};

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get("orderId");

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    if (!highlightOrderId || loading) return;
    const el = document.getElementById(`order-${highlightOrderId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightOrderId, loading]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, product:products(name, image_url)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading your orders...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              id={`order-${order.id}`}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                highlightOrderId === order.id
                  ? "border-kraft-500 ring-2 ring-kraft-300 dark:ring-kraft-700"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Order #{order.order_number || order.id.substring(0, 8)}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">{order.product?.name || "Product"}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {order.shipping_city || order.shipping_address?.city || "—"}
                </span>
                <span>{Number(order.final_customer_price || 0).toFixed(2)} MAD</span>
                <span>{new Date(order.created_at).toLocaleDateString("fr-MA")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
