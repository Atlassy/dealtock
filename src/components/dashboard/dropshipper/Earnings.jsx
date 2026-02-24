// src/components/dashboard/dropshipper/Earnings.jsx
import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../ui/use-toast';

const Earnings = ({ dropshipperId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // week, month, year, all
  const [earnings, setEarnings] = useState({
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });

  useEffect(() => {
    if (dropshipperId) {
      fetchEarnings();
      fetchTransactions();
    }
  }, [dropshipperId, timeframe]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);

      // Get all orders for this dropshipper
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('dropshipper_id', dropshipperId)
        .order('ordered_at', { ascending: false });

      if (error) throw error;

      if (!orders) return;

      // Calculate metrics
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      let totalCommission = 0;
      let pendingCommission = 0;
      let paidCommission = 0;
      let thisMonthTotal = 0;
      let lastMonthTotal = 0;

      orders.forEach(order => {
        const commission = Number(order.dropshipper_markup) || 0;
        totalCommission += commission;

        // Check payment status from payouts table if needed
        if (order.status === 'delivered') {
          paidCommission += commission;
        } else {
          pendingCommission += commission;
        }

        const orderDate = new Date(order.ordered_at);
        if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
          thisMonthTotal += commission;
        }
        if (orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear) {
          lastMonthTotal += commission;
        }
      });

      const growth = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : thisMonthTotal > 0 ? 100 : 0;

      setEarnings({
        totalCommission,
        pendingCommission,
        paidCommission,
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? totalCommission / orders.length : 0,
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        growth
      });

    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Get payouts for this dropshipper
      const { data: payouts, error } = await supabase
        .from('payouts')
        .select(`
          *,
          orders!payouts_order_id_fkey (
            order_number,
            products!orders_product_id_fkey (
              name
            )
          )
        `)
        .eq('user_id', dropshipperId)
        .eq('role', 'dropshipper')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setTransactions(payouts || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getDateRangeText = () => {
    switch (timeframe) {
      case 'week':
        return 'Last 7 days';
      case 'month':
        return 'This month';
      case 'year':
        return 'This year';
      default:
        return 'All time';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Earnings Overview</h2>
        <div className="flex space-x-2">
          {['week', 'month', 'year', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                timeframe === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Commission</p>
          <p className="text-2xl font-bold">{earnings.totalCommission.toFixed(2)} MAD</p>
          <p className="text-xs text-gray-400 mt-2">{getDateRangeText()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{earnings.pendingCommission.toFixed(2)} MAD</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting delivery</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">{earnings.paidCommission.toFixed(2)} MAD</p>
          <p className="text-xs text-gray-400 mt-2">Settled to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Growth</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold">{Math.abs(earnings.growth).toFixed(1)}%</p>
            {earnings.growth >= 0 ? (
              <ArrowUp className="w-5 h-5 text-green-600 ml-2" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-600 ml-2" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">vs last month</p>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium mb-4">This Month</h3>
          <p className="text-3xl font-bold text-blue-600">{earnings.thisMonth.toFixed(2)} MAD</p>
          <p className="text-sm text-gray-600 mt-2">from {earnings.totalOrders} orders</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-medium mb-4">Last Month</h3>
          <p className="text-3xl font-bold text-gray-700">{earnings.lastMonth.toFixed(2)} MAD</p>
          <p className="text-sm text-gray-600 mt-2">Average order: {earnings.averageOrderValue.toFixed(2)} MAD</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Recent Transactions</h3>
            <button className="flex items-center text-sm text-blue-600 hover:text-blue-700">
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      Order #{transaction.orders?.order_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.orders?.products?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{Number(transaction.amount).toFixed(2)} MAD
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status}
                    </span>
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

export default Earnings;