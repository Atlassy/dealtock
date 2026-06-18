// ReturnedProductsSection.jsx
// Parent container — toggles between CSV importer and review queue
// Plugged into AdminDashboard as a new tab

import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Package, Upload, Eye } from "lucide-react";
import ReturnedProductsImporter from "./ReturnedProductsImporter";
import ReturnedProductsQueue    from "./ReturnedProductsQueue";

const VIEWS = { QUEUE: "queue", IMPORT: "import" };

const ReturnedProductsSection = ({ deliveryCompanies = [] }) => {
  const [view, setView]               = useState(VIEWS.QUEUE);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { fetchPendingCount(); }, []);

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("source_type",    "returned")
      .eq("listing_status", "pending_review");
    setPendingCount(count || 0);
  };

  const handleImportComplete = () => {
    fetchPendingCount();
    setView(VIEWS.QUEUE);
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <button
          onClick={() => setView(VIEWS.QUEUE)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === VIEWS.QUEUE
              ? "bg-kraft-50 text-kraft-700 border border-kraft-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Eye className="w-4 h-4" />
          Review Queue
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-kraft-500 text-white rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setView(VIEWS.IMPORT)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === VIEWS.IMPORT
              ? "bg-kraft-50 text-kraft-700 border border-kraft-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>

        {/* Summary pill */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
          <Package className="w-3.5 h-3.5 text-kraft-400" />
          Returned products — sealed parcels only · city-locked · admin-reviewed
        </div>
      </div>

      {/* Active view */}
      {view === VIEWS.QUEUE && (
        <ReturnedProductsQueue
          onSwitchToImport={() => setView(VIEWS.IMPORT)}
        />
      )}

      {view === VIEWS.IMPORT && (
        <ReturnedProductsImporter
          deliveryCompanies={deliveryCompanies}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

export default ReturnedProductsSection;
