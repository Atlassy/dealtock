// src/components/ProtectedLayout.jsx
import React from 'react';

const ProtectedLayout = ({ children }) => {
  return (
    <div className="pt-14 pl-16 min-h-screen bg-neutral-50 dark:bg-gray-900">
      {children}
    </div>
  );
};

export default ProtectedLayout;