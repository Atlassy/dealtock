import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

export const FullPageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-4 flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        ></motion.div>
        <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-primary" />
            <p className="text-lg font-semibold text-gray-300">Chargement de Dealtock...</p>
        </div>
      </motion.div>
    </div>
  );
};