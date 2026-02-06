// src/components/dashboard/DashboardSkeleton.jsx
import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-24"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 p-6 rounded-lg">
            <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Add Product Button Skeleton */}
      <div className="mb-6">
        <div className="h-12 bg-gray-300 rounded w-48"></div>
      </div>

      {/* Products Table Skeleton */}
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;