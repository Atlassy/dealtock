// src/components/dashboard/admin/AdminReturnsDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminReturnsDashboard() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("returns")
        .select(`
          id,
          reason,
          condition_on_return,
          decision,
          created_at,
          orders (
            id,
            seller_id,
            total_amount
          )
        `)
        .eq("return_status", "inspected")
        .eq("decision", "dispute");

      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error("Error fetching returns:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Returns Management</h1>
      
      {returns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No disputed returns found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((returnItem) => (
            <div key={returnItem.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Return ID: {returnItem.id}</p>
                  <p className="text-sm text-gray-600 mt-1">Reason: {returnItem.reason}</p>
                  <p className="text-sm text-gray-600">Condition: {returnItem.condition_on_return}</p>
                  <p className="text-sm text-gray-600">Order Total: ${returnItem.orders?.total_amount}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {returnItem.decision}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(returnItem.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                  Approve Return
                </button>
                <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                  Reject Return
                </button>
                <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                  Review Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}