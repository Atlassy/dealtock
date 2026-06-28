// src/components/dashboard/admin/components/RoleRequestsSection.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Building2, Phone, MessageSquare, Calendar, Check, X } from "lucide-react";

const RoleRequestsSection = ({ onRefresh }) => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("role_requests")
      .select("*, profiles!role_requests_user_id_fkey(email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request) => {
    if (!window.confirm(t('roleRequests.confirmApprove'))) return;
    setProcessingId(request.id);
    const { data, error } = await supabase.rpc('approve_role_request', { p_request_id: request.id });
    setProcessingId(null);

    if (error || !data?.success) {
      toast.error(t('roleRequests.actionFailed'));
      return;
    }
    toast.success(t('roleRequests.approveSuccess'));
    fetchRequests();
    onRefresh?.();
  };

  const handleReject = async (request) => {
    const reason = window.prompt(t('roleRequests.rejectReasonPrompt')) || null;
    setProcessingId(request.id);
    const { data, error } = await supabase.rpc('reject_role_request', { p_request_id: request.id, p_reason: reason });
    setProcessingId(null);

    if (error || !data?.success) {
      toast.error(t('roleRequests.actionFailed'));
      return;
    }
    toast.success(t('roleRequests.rejectSuccess'));
    fetchRequests();
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500 dark:text-gray-400">...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('roleRequests.title')}</h2>

      {requests.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">{t('roleRequests.noRequests')}</p>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{req.company_name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      req.requested_role === 'seller'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                    }`}>
                      {req.requested_role === 'seller' ? t('roleRequests.roleSeller') : t('roleRequests.roleDelivery')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{req.profiles?.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={processingId === req.id}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {t('roleRequests.approve')}
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processingId === req.id}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> {t('roleRequests.reject')}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {req.phone || t('roleRequests.noPhone')}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>

              {req.message && (
                <div className="mt-2 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-2 rounded">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  {req.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleRequestsSection;
