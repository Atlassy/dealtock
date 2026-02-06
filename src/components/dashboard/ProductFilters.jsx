import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Filter, Package, TrendingUp, Truck, PlusCircle } from 'lucide-react';

const statusConfig = {
  available: { labelKey: 'available', icon: Package },
  sold: { labelKey: 'sold', icon: TrendingUp },
  shipped: { labelKey: 'shipped', icon: Truck }
};

export function ProductFilters({ selectedStatus, setSelectedStatus, texts, appLanguage, onAddNewProduct, userRole }) {
  const currentTexts = texts[appLanguage] || texts.fr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap items-center justify-between gap-4 mb-6"
    >
      <div className="flex flex-wrap gap-4">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('all')}
          className="glass-effect border-white/20"
        >
          <Filter className="w-4 h-4 mr-2" />
          {currentTexts.allProducts}
        </Button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const IconComponent = config.icon;
          return (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              onClick={() => setSelectedStatus(status)}
              className="glass-effect border-white/20"
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {currentTexts[config.labelKey]}
            </Button>
          );
        })}
      </div>
      {userRole === 'grossiste' && (
        <Button 
          onClick={onAddNewProduct} 
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {currentTexts.addNewProduct}
        </Button>
      )}
    </motion.div>
  );
}