import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Eye,
  Package,
  AlertCircle,
  User,
  Tag,
  MapPin,
  Calendar,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

const STATUS = {
  PENDING: "pending_review",
  AVAILABLE: "available",
  SUSPENDED: "suspended",
  DECLINED: "declined",
};

const STATUS_CONFIG = {
  [STATUS.PENDING]: {
    label: "Pending Review",
    icon: Clock,
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  [STATUS.AVAILABLE]: {
    label: "Available",
    icon: CheckCircle2,
    classes:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  [STATUS.SUSPENDED]: {
    label: "Suspended",
    icon: PauseCircle,
    classes:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  [STATUS.DECLINED]: {
    label: "Declined",
    icon: XCircle,
    classes:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

const ProductListingManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState(STATUS.PENDING);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [processingId, setProcessingId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReasonCode, setDeclineReasonCode] = useState("");
  const [declineReasonDetail, setDeclineReasonDetail] = useState("");

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenReason, setReopenReason] = useState("");

  const [declineReasons, setDeclineReasons] = useState([]);

  const loadDeclineReasons = useCallback(async () => {
    const { data, error } = await supabase
      .from("product_decline_reasons")
      .select("code, label, sort_order, is_active, context")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to load decline reasons:", error);
      return;
    }

    setDeclineReasons(
      (data || []).filter(
        (reason) => !reason.context || reason.context === "generic"
      )
    );
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("admin_products")
        .select("*")
        .eq("source_type", "new")
        .eq("listing_status", filter)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setProducts(data || []);
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to load product listings:", error);
      toast.error(`Failed to load product listings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadProducts();
    loadDeclineReasons();
  }, [loadProducts, loadDeclineReasons]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const moderateProduct = async ({
    productId,
    newStatus,
    reasonCode = null,
    reasonDetail = null,
  }) => {
    const { data, error } = await supabase.rpc("moderate_product", {
      p_product_id: productId,
      p_new_status: newStatus,
      p_reason_code: reasonCode,
      p_reason_detail: reasonDetail,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const handleApprove = async (product) => {
    try {
      setProcessingId(product.id);
      await moderateProduct({ productId: product.id, newStatus: STATUS.AVAILABLE });
      toast.success(`"${product.name}" approved`);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      console.error("Approve product error:", error);
      toast.error(`Unable to approve "${product.name}": ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const openDeclineModal = (product) => {
    setDeclineTarget(product);
    setDeclineReasonCode("");
    setDeclineReasonDetail("");
    setDeclineModalOpen(true);
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    if (!declineReasonCode) {
      toast.error("Please select a decline reason.");
      return;
    }
    if (declineReasonCode === "other" && !declineReasonDetail.trim()) {
      toast.error("Please provide details for 'Other'.");
      return;
    }

    try {
      setProcessingId(declineTarget.id);
      await moderateProduct({
        productId: declineTarget.id,
        newStatus: STATUS.DECLINED,
        reasonCode: declineReasonCode,
        reasonDetail: declineReasonDetail.trim() || null,
      });
      toast.success(`"${declineTarget.name}" declined`);
      setDeclineModalOpen(false);
      setDeclineTarget(null);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      console.error("Decline product error:", error);
      toast.error(`Unable to decline "${declineTarget.name}": ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (product) => {
    if (!window.confirm(`Suspend "${product.name}" from the marketplace?`)) {
      return;
    }
    try {
      setProcessingId(product.id);
      await moderateProduct({ productId: product.id, newStatus: STATUS.SUSPENDED });
      toast.success(`"${product.name}" suspended`);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      console.error("Suspend product error:", error);
      toast.error(`Unable to suspend "${product.name}": ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (product) => {
    try {
      setProcessingId(product.id);
      await moderateProduct({ productId: product.id, newStatus: STATUS.AVAILABLE });
      toast.success(`"${product.name}" restored`);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      console.error("Restore product error:", error);
      toast.error(`Unable to restore "${product.name}": ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const openReopenModal = (product) => {
    setReopenTarget(product);
    setReopenReason("");
    setReopenModalOpen(true);
  };

  const handleAdminReopen = async () => {
    if (!reopenTarget) return;
    if (!reopenReason.trim()) {
      toast.error("A justification is required.");
      return;
    }

    try {
      setProcessingId(reopenTarget.id);
      const { error } = await supabase.rpc("admin_reopen_declined_product", {
        p_product_id: reopenTarget.id,
        p_override_reason: reopenReason.trim(),
      });

      if (error) {
        throw error;
      }

      toast.success(`"${reopenTarget.name}" returned to Pending Review`);
      setReopenModalOpen(false);
      setReopenTarget(null);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error) {
      console.error("Admin reopen error:", error);
      toast.error(`Unable to reopen "${reopenTarget.name}": ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === filteredProducts.length ? [] : filteredProducts.map((product) => product.id)
    );
  };

  const [bulkDeclineModalOpen, setBulkDeclineModalOpen] = useState(false);

  const openBulkDeclineModal = () => {
    setDeclineTarget(null);
    setDeclineReasonCode("");
    setDeclineReasonDetail("");
    setBulkDeclineModalOpen(true);
  };

  const handleBulkModerate = async (newStatus) => {
    if (!selectedIds.length) return;

    if (newStatus === STATUS.DECLINED) {
      openBulkDeclineModal();
      return;
    }

    const actionLabel = newStatus === STATUS.AVAILABLE ? "approve" : "suspend";

    if (
      !window.confirm(
        `${actionLabel === "approve" ? "Approve" : "Suspend"} ${selectedIds.length} selected product(s)?`
      )
    ) {
      return;
    }

    try {
      setBulkProcessing(true);
      const { data, error } = await supabase.rpc("moderate_products_bulk", {
        p_product_ids: selectedIds,
        p_new_status: newStatus,
        p_reason_code: null,
        p_reason_detail: null,
      });

      if (error) {
        throw error;
      }

      const results = data || [];
      const failures = results.filter((item) => !item.success);
      const successes = results.filter((item) => item.success);

      if (failures.length > 0) {
        toast.warning(`${successes.length} succeeded, ${failures.length} failed.`);
        console.warn("Bulk moderation failures:", failures);
      } else {
        toast.success(`${successes.length} product(s) updated successfully`);
      }

      setSelectedIds([]);
      await loadProducts();
    } catch (error) {
      console.error("Bulk moderation error:", error);
      toast.error(`Bulk moderation failed: ${error.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDecline = async () => {
    if (!declineReasonCode) {
      toast.error("Please select a decline reason.");
      return;
    }
    if (declineReasonCode === "other" && !declineReasonDetail.trim()) {
      toast.error("Please provide details for 'Other'.");
      return;
    }

    try {
      setBulkProcessing(true);
      const { data, error } = await supabase.rpc("moderate_products_bulk", {
        p_product_ids: selectedIds,
        p_new_status: STATUS.DECLINED,
        p_reason_code: declineReasonCode,
        p_reason_detail: declineReasonDetail.trim() || null,
      });

      if (error) {
        throw error;
      }

      const results = data || [];
      const failures = results.filter((item) => !item.success);
      const successes = results.filter((item) => item.success);

      if (failures.length) {
        toast.warning(`${successes.length} declined, ${failures.length} failed.`);
        console.warn("Bulk decline failures:", failures);
      } else {
        toast.success(`${successes.length} product(s) declined`);
      }

      setSelectedIds([]);
      setBulkDeclineModalOpen(false);
      setDeclineReasonCode("");
      setDeclineReasonDetail("");
      await loadProducts();
    } catch (error) {
      console.error("Bulk decline error:", error);
      toast.error(`Bulk decline failed: ${error.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return products;

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.category,
        product.location,
        product.seller_name,
        product.seller_email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [products, searchTerm]);

  const currentStatus = STATUS_CONFIG[filter];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-kraft-500" />
            Product Listing Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage marketplace product listings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                filter === status
                  ? "bg-kraft-50 dark:bg-kraft-900/30 border-kraft-300 dark:border-kraft-700 text-kraft-700 dark:text-kraft-400"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search product, SKU, seller, category or city..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-kraft-400 focus:border-kraft-400"
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>{selectedIds.length}</strong> product(s) selected
          </div>

          <div className="flex flex-wrap gap-2">
            {filter === STATUS.PENDING && (
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkModerate(STATUS.AVAILABLE)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Selected
              </button>
            )}

            {(filter === STATUS.PENDING || filter === STATUS.AVAILABLE || filter === STATUS.SUSPENDED) && (
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => openBulkDeclineModal()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Decline Selected
              </button>
            )}

            {filter === STATUS.AVAILABLE && (
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleBulkModerate(STATUS.SUSPENDED)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                <PauseCircle className="w-4 h-4" />
                Suspend Selected
              </button>
            )}
          </div>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredProducts.length}
            onChange={toggleSelectAll}
            className="rounded text-kraft-500 focus:ring-kraft-400"
          />
          Select all
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
          Loading product listings...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="font-medium text-gray-600 dark:text-gray-300">
            No {currentStatus.label.toLowerCase()} products
          </p>
          <p className="text-sm text-gray-400 mt-1">There are no product listings matching this view.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="text-left px-3 py-3">Product</th>
                  <th className="text-left px-3 py-3">Seller</th>
                  <th className="text-left px-3 py-3">Category</th>
                  <th className="text-left px-3 py-3">Condition</th>
                  <th className="text-left px-3 py-3">Price</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-right px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const config = STATUS_CONFIG[product.listing_status] || STATUS_CONFIG[STATUS.PENDING];
                  const StatusIcon = config.icon;
                  const isProcessing = processingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelected(product.id)}
                          className="rounded text-kraft-500 focus:ring-kraft-400"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[220px]">
                              {product.name}
                            </div>
                            {product.sku && (
                              <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-gray-800 dark:text-gray-200">
                          {product.seller_name || product.seller_email || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {product.category || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {product.condition || "—"}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                        {product.asking_price ?? product.purchase_price ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.classes}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Review"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {filter === STATUS.PENDING && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(product)}
                              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {filter === STATUS.PENDING && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => openDeclineModal(product)}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                              title="Decline"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {filter === STATUS.AVAILABLE && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleSuspend(product)}
                              className="p-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                              title="Suspend"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}

                          {filter === STATUS.SUSPENDED && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleRestore(product)}
                              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                              title="Restore"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {filter === STATUS.DECLINED && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => openReopenModal(product)}
                              className="p-2 rounded-lg bg-kraft-600 hover:bg-kraft-700 text-white disabled:opacity-50"
                              title="Reopen for review"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Product Review</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review the listing information before applying a moderation action.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-48 h-48 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedProduct.name}
                  </h3>

                  <div className="mt-3">
                    {(() => {
                      const config =
                        STATUS_CONFIG[selectedProduct.listing_status] || STATUS_CONFIG[STATUS.PENDING];
                      const Icon = config.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.classes}`}
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400">Seller</div>
                        <div className="text-gray-800 dark:text-gray-200">
                          {selectedProduct.seller_name || selectedProduct.seller_email || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400">Category</div>
                        <div className="text-gray-800 dark:text-gray-200">
                          {selectedProduct.category || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400">Location</div>
                        <div className="text-gray-800 dark:text-gray-200">
                          {selectedProduct.location || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-400">Created</div>
                        <div className="text-gray-800 dark:text-gray-200">
                          {selectedProduct.created_at
                            ? new Date(selectedProduct.created_at).toLocaleString("fr-MA")
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedProduct.description || "No description provided."}
                </div>
              </div>

              {selectedProduct.decline_reason && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-red-700 dark:text-red-400">Decline information</div>
                      <div className="mt-1 text-sm text-red-600 dark:text-red-300">
                        {selectedProduct.decline_reason}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                Close
              </button>

              {selectedProduct.listing_status === STATUS.PENDING && (
                <>
                  <button
                    type="button"
                    disabled={processingId === selectedProduct.id}
                    onClick={() => openDeclineModal(selectedProduct)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={processingId === selectedProduct.id}
                    onClick={() => handleApprove(selectedProduct)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Listing
                  </button>
                </>
              )}

              {selectedProduct.listing_status === STATUS.AVAILABLE && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSuspend(selectedProduct)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium"
                  >
                    <PauseCircle className="w-4 h-4" />
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeclineModal(selectedProduct)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}

              {selectedProduct.listing_status === STATUS.SUSPENDED && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRestore(selectedProduct)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeclineModal(selectedProduct)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}

              {selectedProduct.listing_status === STATUS.DECLINED && (
                <button
                  type="button"
                  onClick={() => openReopenModal(selectedProduct)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-kraft-600 hover:bg-kraft-700 text-white text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reopen for Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {declineModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Decline Product Listing</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{declineTarget?.name}</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <select
                  value={declineReasonCode}
                  onChange={(event) => setDeclineReasonCode(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                >
                  <option value="">Select a reason</option>
                  {declineReasons.map((reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional details{declineReasonCode === "other" && " *"}
                </label>
                <textarea
                  value={declineReasonDetail}
                  onChange={(event) => setDeclineReasonDetail(event.target.value)}
                  rows={4}
                  placeholder="Optional additional explanation..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDeclineModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === declineTarget?.id}
                onClick={handleDecline}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                Decline Product
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeclineModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Decline Selected Products</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedIds.length} product(s) selected
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <select
                  value={declineReasonCode}
                  onChange={(event) => setDeclineReasonCode(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                >
                  <option value="">Select a reason</option>
                  {declineReasons.map((reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={declineReasonDetail}
                onChange={(event) => setDeclineReasonDetail(event.target.value)}
                rows={4}
                placeholder="Optional additional explanation..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setBulkDeclineModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={handleBulkDecline}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                Decline Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {reopenModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Reopen Product for Review</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reopenTarget?.name}</p>
            </div>

            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admin justification *
              </label>
              <textarea
                value={reopenReason}
                onChange={(event) => setReopenReason(event.target.value)}
                rows={5}
                placeholder="Explain why this declined listing should be reviewed again..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === reopenTarget?.id}
                onClick={handleAdminReopen}
                className="px-4 py-2 rounded-lg bg-kraft-600 hover:bg-kraft-700 text-white text-sm font-medium disabled:opacity-50"
              >
                Reopen for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListingManagement;
