import React from 'react';
import { motion } from 'framer-motion';

const DealtockLogo = ({ size = 'normal', className = '' }) => {
  const sizes = {
    small: 'w-8 h-8',
    normal: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const containerSize = sizes[size] || sizes.normal;

  return (
    <div
      className={`${containerSize} flex items-center justify-center ${className}`}
    >
      {/* ✅ FIXED: Changed from img-replace to img */}
      <img 
        src="https://ibb.co/S4wjBvFK" 
        alt="Dealtock Logo" 
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback if image fails to load
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">D</span>
            </div>
          `;
        }}
      />
    </div>
  );
};

const AnimatedDealtockLogo = ({ size = 'large' }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
    className="mx-auto"
  >
    <DealtockLogo size={size} />
  </motion.div>
);

export { DealtockLogo, AnimatedDealtockLogo };