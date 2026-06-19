// src/components/dashboard/admin/components/OverviewSection.jsx
import React, { useState } from "react";
import { 
  Package, 
  Truck, 
  Shield, 
  DollarSign, 
  TrendingUp,
  Users,
  Eye,
  Percent,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Activity
} from "lucide-react";
import { formatCurrency, formatDate } from '../utils/helpers';

const OverviewSection = ({ stats, recentActivity, onRefresh, isLoading, onTabChange, dataHealth = { ok: true, failedQueries: [] } }) => {
  const [showAllActivity, setShowAllActivity] = useState(false);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: Package,
      color: "bg-blue-500",
      description: `${stats.deliveredOrders} delivered`
    },
    {
      title: "Pending Escrows",
      value: stats.pendingEscrows,
      icon: Shield,
      color: "bg-yellow-500",
      amount: formatCurrency(stats.totalEscrowAmount),
      description: "Awaiting release"
    },
    {
      title: "Active Deliveries",
      value: stats.activeDeliveries,
      icon: Truck,
      color: "bg-green-500",
      description: `${stats.shippedOrders} orders in transit`
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-purple-500",
      description: `COD: ${stats.codOrders} orders`
    },
    {
      title: "Order Status",
      value: `${stats.deliveredOrders}/${stats.shippedOrders}/${stats.pendingOrders}`,
      icon: TrendingUp,
      color: "bg-kraft-500",
      description: "Delivered/In Transit/Pending"
    },
    {
      title: "Users",
      value: stats.totalSellers + stats.totalDropshippers,
      icon: Users,
      color: "bg-indigo-500",
      description: `${stats.totalSellers} sellers, ${stats.totalDropshippers} dropshippers`
    }
  ];

  const quickActions = [
    {
      label: "Manage Delivery",
      icon: Truck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
      tab: "delivery",
      description: "Add/Edit companies"
    },
    {
      label: "Review Escrows",
      icon: Shield,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/30",
      tab: "escrow",
      description: "Release payments",
      badge: stats.pendingEscrows
    },
    {
      label: "Order Oversight",
      icon: Eye,
      color: "text-kraft-600 dark:text-kraft-400",
      bgColor: "bg-kraft-50 dark:bg-kraft-900/30",
      tab: "orders",
      description: "View all orders"
    },
    {
      label: "Commission Rules",
      icon: Percent,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
      tab: "commissions",
      description: "Configure fees"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Platform Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Real-time metrics and platform health
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{card.value}</div>
                {card.amount && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{card.amount}</div>
                )}
              </div>
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
              {card.trend && (
                <span className={`text-xs font-medium ${card.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {card.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onTabChange(action.tab)}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className={`${action.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white">{action.label}</h4>
                      {action.badge > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, idx) => (
                <div key={activity.id || idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                      {activity.admin?.full_name || 'System'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {activity.reason || activity.action_type}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
          {recentActivity.length > 5 && (
            <button
              onClick={() => setShowAllActivity(true)}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View all activity →
            </button>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dataHealth.ok ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Database queries (last refresh)</span>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                dataHealth.ok
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
              }`}
              title={dataHealth.failedQueries.length > 0 ? `Failed: ${dataHealth.failedQueries.join(', ')}` : undefined}
            >
              {dataHealth.ok ? 'All OK' : `${dataHealth.failedQueries.length} failed`}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${stats.pendingEscrows > 0 ? 'bg-yellow-500' : 'bg-green-500'} rounded-full`}></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Escrow Queue</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              stats.pendingEscrows > 0
                ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
                : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
            }`}>
              {stats.pendingEscrows} pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;