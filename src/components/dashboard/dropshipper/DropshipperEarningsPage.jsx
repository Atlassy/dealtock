// src/components/dashboard/dropshipper/DropshipperEarningsPage.jsx
import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Download, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

const DropshipperEarningsPage = ({ dropshipperId }) => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');
  const [earnings, setEarnings] = useState({
    grossCommission: 0,
    dealtockFees: 0,
    netEarnings: 0,
    pendingGross: 0,
    pendingNet: 0,
    paidGross: 0,
    paidNet: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    averageCommission: 0,
    thisMonthGross: 0,
    thisMonthNet: 0,
    lastMonthGross: 0,
    lastMonthNet: 0,
    growth: 0
  });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (dropshipperId) {
      fetchEarnings();
      fetchTransactions();
    }
  }, [dropshipperId, timeframe]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);

      const now = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          products!inner (
            name
          )
        `)
        .eq('dropshipper_id', dropshipperId)
        .gte('ordered_at', startDate.toISOString())
        .order('ordered_at', { ascending: false });

      if (error) throw error;

      if (!orders) {
        setEarnings(prev => ({ ...prev, totalOrders: 0 }));
        return;
      }

      const now_date = new Date();
      const thisMonth = now_date.getMonth();
      const thisYear = now_date.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      let grossCommission = 0;
      let dealtockFees = 0;
      let netEarnings = 0;
      let pendingGross = 0;
      let pendingNet = 0;
      let paidGross = 0;
      let paidNet = 0;
      let thisMonthGross = 0;
      let thisMonthNet = 0;
      let lastMonthGross = 0;
      let lastMonthNet = 0;

      orders.forEach(order => {
        const gross = Number(order.dropshipper_markup) || 0;
        const fee = Number(order.dropshipper_commission_amount) || 0;
        const net = gross - fee;

        grossCommission += gross;
        dealtockFees += fee;
        netEarnings += net;

        if (order.status === 'delivered' || order.status === 'settled') {
          paidGross += gross;
          paidNet += net;
        } else {
          pendingGross += gross;
          pendingNet += net;
        }

        const orderDate = new Date(order.ordered_at);
        if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
          thisMonthGross += gross;
          thisMonthNet += net;
        }
        if (orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear) {
          lastMonthGross += gross;
          lastMonthNet += net;
        }
      });

      const growth = lastMonthNet > 0 
        ? ((thisMonthNet - lastMonthNet) / lastMonthNet) * 100 
        : thisMonthNet > 0 ? 100 : 0;

      setEarnings({
        grossCommission,
        dealtockFees,
        netEarnings,
        pendingGross,
        pendingNet,
        paidGross,
        paidNet,
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? netEarnings / orders.length : 0,
        averageCommission: grossCommission > 0 ? (dealtockFees / grossCommission) * 100 : 0,
        thisMonthGross,
        thisMonthNet,
        lastMonthGross,
        lastMonthNet,
        growth
      });

    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          ordered_at,
          dropshipper_markup,
          dropshipper_commission_amount,
          dropshipper_net_earnings,
          status,
          products!inner (
            name
          )
        `)
        .eq('dropshipper_id', dropshipperId)
        .order('ordered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(orders || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getDateRangeText = () => {
    switch (timeframe) {
      case 'week': return 'Last 7 days';
      case 'month': return 'This month';
      case 'year': return 'This year';
      default: return 'All time';
    }
  };

  const formatCurrency = (value) => {
    return `${Number(value).toFixed(2)} MAD`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your commissions and payouts</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{getDateRangeText()}</p>
        <div className="flex space-x-2">
          {['week', 'month', 'year', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                timeframe === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross Revenue (Markup)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(earnings.grossCommission)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Total markup before fees</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dealtock Fees</p>
          <p className="text-2xl font-bold text-kraft-600 dark:text-kraft-400">{formatCurrency(earnings.dealtockFees)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{earnings.averageCommission.toFixed(1)}% avg commission</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-900/40 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Earnings</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(earnings.netEarnings)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">After Dealtock fees</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Growth</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.abs(earnings.growth).toFixed(1)}%</p>
            {earnings.growth >= 0 ? (
              <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400 ml-2" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-600 dark:text-red-400 ml-2" />
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">vs last month (net)</p>
        </div>
      </div>

      {/* Pending vs Paid Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Pending Earnings</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Gross Pending:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(earnings.pendingGross)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Dealtock Fees:</span>
              <span className="text-kraft-600 dark:text-kraft-400">-{formatCurrency(earnings.pendingGross - earnings.pendingNet)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Your Net:</span>
              <span className="text-yellow-600 dark:text-yellow-400">{formatCurrency(earnings.pendingNet)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Paid Earnings</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Gross Paid:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(earnings.paidGross)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Dealtock Fees:</span>
              <span className="text-kraft-600 dark:text-kraft-400">-{formatCurrency(earnings.paidGross - earnings.paidNet)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white">Your Net:</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(earnings.paidNet)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const csv = [
              ['Order', 'Product', 'Date', 'Gross Markup', 'Dealtock Fee', 'Net Earnings', 'Status'],
              ...transactions.map(t => [
                t.order_number,
                t.products?.name,
                new Date(t.ordered_at).toLocaleDateString(),
                t.dropshipper_markup,
                t.dropshipper_commission_amount,
                t.dropshipper_net_earnings,
                t.status
              ])
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Earnings exported');
          }}
          className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-auto">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">Order #{transaction.order_number}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.status === 'delivered' || transaction.status === 'settled'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : transaction.status === 'ordered' || transaction.status === 'approved'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{transaction.products?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(transaction.ordered_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Gross: <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.dropshipper_markup)}</span>
                    </p>
                    <p className="text-xs text-kraft-600 dark:text-kraft-400">
                      Fee: -{formatCurrency(transaction.dropshipper_commission_amount)}
                    </p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      Net: {formatCurrency(transaction.dropshipper_net_earnings)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DropshipperEarningsPage;