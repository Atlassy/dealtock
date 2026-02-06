import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingUp, Truck, Euro, Percent } from 'lucide-react';

export function StatsCards({ stats, texts, appLanguage, formatPrice }) {
  const currentTexts = texts[appLanguage] || texts.fr;

  const cardData = [
    { labelKey: 'totalProducts', value: stats.total, icon: Package, iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500', valueColor: 'text-white' },
    { labelKey: 'available', value: stats.available, icon: Package, iconBg: 'status-available', valueColor: 'text-green-400' },
    { labelKey: 'sold', value: stats.sold, icon: TrendingUp, iconBg: 'status-sold', valueColor: 'text-orange-400' },
    { labelKey: 'shipped', value: stats.shipped, icon: Truck, iconBg: 'status-delivered', valueColor: 'text-purple-400' },
    { labelKey: 'totalValue', value: formatPrice(stats.totalValue), icon: Euro, iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500', valueColor: 'text-white' },
    { labelKey: 'totalSoldAmount', value: formatPrice(stats.totalSoldAmount), icon: TrendingUp, iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500', valueColor: 'text-orange-300' },
    { labelKey: 'totalCommission', value: formatPrice(stats.totalCommission), icon: Percent, iconBg: 'bg-gradient-to-br from-red-500 to-pink-500', valueColor: 'text-red-400' },
    { labelKey: 'totalNetToReceive', value: formatPrice(stats.totalNetToReceive), icon: Euro, iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-500', valueColor: 'text-teal-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {cardData.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="glass-effect border-white/20 card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">{currentTexts[card.labelKey]}</p>
                  <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.div>
  );
}